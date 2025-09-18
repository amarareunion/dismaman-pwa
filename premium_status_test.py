#!/usr/bin/env python3
"""
Premium Status Test for test@dismaman.fr Account
Specific test to verify the premium status issue reported in the review request.
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class PremiumStatusTester:
    def __init__(self):
        self.access_token = None
        self.test_user_email = "test@dismaman.fr"
        self.test_user_password = "Test123!"
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
        if details:
            print(f"    Details: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: dict = None, auth_required: bool = True) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{API_BASE}{endpoint}"
        
        headers = {"Content-Type": "application/json"}
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_login(self) -> bool:
        """Test login with test@dismaman.fr credentials"""
        test_name = "Login Authentication"
        
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.log_test(test_name, "PASS", f"Successfully logged in as {self.test_user_email}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_monetization_status(self) -> bool:
        """Test GET /api/monetization/status and verify premium status fields"""
        test_name = "Monetization Status API"
        
        try:
            response = self.make_request("GET", "/monetization/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["is_premium", "trial_days_left", "questions_this_month"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"Missing required fields: {missing_fields}")
                    return False
                
                # Extract the specific fields mentioned in the review
                is_premium = data.get("is_premium")
                trial_days_left = data.get("trial_days_left")
                questions_this_month = data.get("questions_this_month")
                
                # Log the actual values
                self.log_test(test_name, "PASS", 
                    f"API Response - is_premium: {is_premium}, trial_days_left: {trial_days_left}, questions_this_month: {questions_this_month}")
                
                # Verify data types
                if not isinstance(is_premium, bool):
                    self.log_test("Data Type Validation", "FAIL", f"is_premium should be boolean, got: {type(is_premium)}")
                    return False
                
                if not isinstance(trial_days_left, int):
                    self.log_test("Data Type Validation", "FAIL", f"trial_days_left should be integer, got: {type(trial_days_left)}")
                    return False
                
                if not isinstance(questions_this_month, int):
                    self.log_test("Data Type Validation", "FAIL", f"questions_this_month should be integer, got: {type(questions_this_month)}")
                    return False
                
                # Check if the reported issue exists
                if is_premium and trial_days_left > 0:
                    self.log_test("Premium Status Verification", "PASS", 
                        f"User has premium status (is_premium=True) with {trial_days_left} trial days remaining")
                elif is_premium and trial_days_left <= 0:
                    self.log_test("Premium Status Verification", "PASS", 
                        f"User has premium status (is_premium=True) with expired trial ({trial_days_left} days)")
                else:
                    self.log_test("Premium Status Verification", "INFO", 
                        f"User does not have premium status (is_premium=False) with {trial_days_left} trial days")
                
                # Print full response for debugging
                print("Full API Response:")
                print(json.dumps(data, indent=2, default=str))
                print()
                
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_history_access_logic(self) -> bool:
        """Test the logic that determines history access based on premium status"""
        test_name = "History Access Logic"
        
        try:
            # First get the monetization status
            status_response = self.make_request("GET", "/monetization/status")
            
            if status_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not get monetization status: {status_response.status_code}")
                return False
            
            status_data = status_response.json()
            is_premium = status_data.get("is_premium", False)
            trial_days_left = status_data.get("trial_days_left", 0)
            
            # Determine if user should have history access
            should_have_history_access = is_premium or trial_days_left > 0
            
            # Test if user can actually access history by trying to get children first
            children_response = self.make_request("GET", "/children")
            
            if children_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not get children list: {children_response.status_code}")
                return False
            
            children = children_response.json()
            
            if len(children) == 0:
                self.log_test(test_name, "INFO", "No children found - cannot test history access")
                return True
            
            # Try to access history for the first child
            child_id = children[0]["id"]
            history_response = self.make_request("GET", f"/responses/child/{child_id}")
            
            if history_response.status_code == 200:
                history_data = history_response.json()
                actual_has_access = True
                self.log_test(test_name, "PASS", 
                    f"User can access history (retrieved {len(history_data)} entries)")
            elif history_response.status_code in [401, 403, 402]:
                actual_has_access = False
                self.log_test(test_name, "INFO", 
                    f"User cannot access history (status: {history_response.status_code})")
            else:
                self.log_test(test_name, "FAIL", 
                    f"Unexpected response when accessing history: {history_response.status_code}")
                return False
            
            # Compare expected vs actual access
            if should_have_history_access == actual_has_access:
                self.log_test("History Access Consistency", "PASS", 
                    f"History access is consistent with premium status (should_have_access={should_have_history_access}, actual_access={actual_has_access})")
            else:
                self.log_test("History Access Consistency", "FAIL", 
                    f"History access inconsistent! should_have_access={should_have_history_access}, actual_access={actual_has_access}")
                return False
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_premium_status_tests(self):
        """Run all premium status tests"""
        print("="*80)
        print("🔍 PREMIUM STATUS DIAGNOSTIC TEST")
        print("="*80)
        print(f"Testing premium status issue for account: {self.test_user_email}")
        print(f"Backend URL: {BACKEND_URL}")
        print("="*80)
        print()
        
        # Test 1: Login
        if not self.test_login():
            print("❌ Cannot proceed without successful login")
            return False
        
        # Test 2: Check monetization status API
        if not self.test_monetization_status():
            print("❌ Monetization status API failed")
            return False
        
        # Test 3: Test history access logic
        if not self.test_history_access_logic():
            print("❌ History access logic test failed")
            return False
        
        print("="*80)
        print("✅ ALL PREMIUM STATUS TESTS COMPLETED")
        print("="*80)
        print()
        print("SUMMARY:")
        print("- Successfully authenticated with test@dismaman.fr")
        print("- Retrieved monetization status from GET /api/monetization/status")
        print("- Verified is_premium, trial_days_left, and questions_this_month fields")
        print("- Tested history access consistency with premium status")
        print()
        print("If the frontend thinks the user doesn't have history access,")
        print("the issue is likely in the frontend logic, not the backend API.")
        
        return True

if __name__ == "__main__":
    tester = PremiumStatusTester()
    tester.run_premium_status_tests()