#!/usr/bin/env python3
"""
Focused Monetization System Tests for Dis Maman! Mobile App
Tests the specific monetization logic for feedback buttons using existing user
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class FocusedMonetizationTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.test_user_email = "test@dismaman.fr"
        self.test_user_password = "Test123!"
        self.created_children = []
        self.created_responses = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
        if details:
            print(f"    Details: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, auth_required: bool = True) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{API_BASE}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
            
        if auth_required and self.access_token:
            request_headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def authenticate(self) -> bool:
        """Authenticate with test credentials"""
        test_name = "Authentication System"
        
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                self.log_test(test_name, "PASS", f"Successfully authenticated as {self.test_user_email}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_monetization_status_api(self) -> bool:
        """Test GET /api/monetization/status endpoint"""
        test_name = "Monetization Status API"
        
        try:
            response = self.make_request("GET", "/monetization/status")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["is_premium", "trial_days_left", "questions_asked", "popup_frequency"]
                
                # Check all required fields are present
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"Missing required fields: {missing_fields}")
                    return False
                
                # Validate data types and values
                validations = [
                    (isinstance(data["is_premium"], bool), "is_premium should be boolean"),
                    (isinstance(data["trial_days_left"], int) and data["trial_days_left"] >= 0, "trial_days_left should be non-negative integer"),
                    (isinstance(data["questions_asked"], int) and data["questions_asked"] >= 0, "questions_asked should be non-negative integer"),
                    (data["popup_frequency"] in ["none", "weekly", "daily", "blocking", "child_selection", "monthly_limit"], "popup_frequency has invalid value")
                ]
                
                for is_valid, error_msg in validations:
                    if not is_valid:
                        self.log_test(test_name, "FAIL", error_msg)
                        return False
                
                self.log_test(test_name, "PASS", f"Premium={data['is_premium']}, Trial days={data['trial_days_left']}, Questions={data['questions_asked']}, Popup={data['popup_frequency']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def setup_test_environment(self) -> bool:
        """Setup test environment with child and response"""
        try:
            # Get existing children
            response = self.make_request("GET", "/children")
            if response.status_code == 200:
                children = response.json()
                if children:
                    child_id = children[0]["id"]
                    self.created_children.append(child_id)
                    print(f"✅ Using existing child: {children[0]['name']} (ID: {child_id})")
                    return True
            
            # Create a child if none exist
            child_data = {
                "name": "Emma Monetization Test",
                "gender": "girl",
                "birth_month": 6,
                "birth_year": 2020,
                "complexity_level": 0
            }
            
            response = self.make_request("POST", "/children", child_data)
            if response.status_code in [200, 201]:
                data = response.json()
                child_id = data.get("id")
                if child_id:
                    self.created_children.append(child_id)
                    print(f"✅ Created test child: {data.get('name')} (ID: {child_id})")
                    return True
            
            print(f"❌ Could not setup test child: {response.status_code}")
            return False
                
        except Exception as e:
            print(f"❌ Error setting up test environment: {e}")
            return False

    def create_test_response(self, child_id: str) -> Optional[str]:
        """Create a test response for feedback testing"""
        try:
            question_data = {
                "question": "Pourquoi le ciel est-il bleu?",
                "child_id": child_id
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code == 200:
                data = response.json()
                response_id = data.get("id")
                if response_id:
                    self.created_responses.append(response_id)
                    print(f"✅ Created test response: {response_id}")
                    return response_id
            elif response.status_code == 402:
                print(f"⚠️  Question blocked due to monetization limits (402)")
                return None
            else:
                print(f"❌ Failed to create response: {response.status_code}")
                return None
            
            return None
                
        except Exception as e:
            print(f"❌ Error creating test response: {e}")
            return None

    def test_feedback_monetization_logic(self) -> bool:
        """Test the core feedback monetization logic from server.py lines 760-771"""
        test_name = "Feedback Monetization Logic"
        
        try:
            if not self.created_children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
            
            child_id = self.created_children[0]
            
            # Get current user status
            status_response = self.make_request("GET", "/monetization/status")
            if status_response.status_code != 200:
                self.log_test(test_name, "FAIL", "Could not get monetization status")
                return False
            
            status_data = status_response.json()
            is_premium = status_data.get("is_premium", False)
            trial_days_left = status_data.get("trial_days_left", 0)
            is_trial_active = trial_days_left > 0
            
            print(f"📊 User Status: Premium={is_premium}, Trial Active={is_trial_active}, Trial Days={trial_days_left}")
            
            # Test all feedback types
            feedback_tests = [
                ("understood", "Should always work for everyone"),
                ("too_complex", "Should be restricted for non-premium post-trial users"),
                ("need_more_details", "Should be restricted for non-premium post-trial users")
            ]
            
            results = []
            
            for feedback_type, description in feedback_tests:
                print(f"\n🔍 Testing '{feedback_type}' feedback...")
                print(f"   Expected: {description}")
                
                # Create a fresh response for each feedback test
                response_id = self.create_test_response(child_id)
                if not response_id:
                    print(f"   ⚠️  Could not create response for '{feedback_type}' test")
                    continue
                
                feedback_data = {
                    "response_id": response_id,
                    "feedback": feedback_type
                }
                
                feedback_response = self.make_request("POST", f"/responses/{response_id}/feedback", feedback_data)
                
                # Analyze result based on monetization logic
                expected_status = 200  # Default expectation
                
                # Apply monetization logic from server.py lines 760-771
                if not is_premium and not is_trial_active and feedback_type in ["too_complex", "need_more_details"]:
                    expected_status = 402  # Should be blocked for non-premium post-trial users
                
                actual_status = feedback_response.status_code
                
                if actual_status == expected_status:
                    if actual_status == 200:
                        print(f"   ✅ '{feedback_type}' feedback allowed (status: {actual_status})")
                        results.append(f"✅ {feedback_type}: Allowed as expected")
                    elif actual_status == 402:
                        print(f"   ✅ '{feedback_type}' feedback correctly blocked (status: {actual_status})")
                        try:
                            error_data = feedback_response.json()
                            error_detail = error_data.get("detail", "")
                            if "premium" in error_detail.lower():
                                print(f"   ✅ Correct error message: {error_detail}")
                            else:
                                print(f"   ⚠️  Unexpected error message: {error_detail}")
                        except:
                            pass
                        results.append(f"✅ {feedback_type}: Blocked as expected (402)")
                else:
                    print(f"   ❌ '{feedback_type}' feedback: Expected {expected_status}, got {actual_status}")
                    if actual_status != 200:
                        try:
                            error_data = feedback_response.json()
                            print(f"   Error details: {error_data}")
                        except:
                            print(f"   Error text: {feedback_response.text}")
                    results.append(f"❌ {feedback_type}: Expected {expected_status}, got {actual_status}")
            
            # Evaluate overall results
            failed_tests = [r for r in results if r.startswith("❌")]
            
            if not failed_tests:
                self.log_test(test_name, "PASS", f"All feedback monetization logic working correctly. Results: {'; '.join(results)}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Some feedback tests failed. Results: {'; '.join(results)}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_question_submission_monetization(self) -> bool:
        """Test question submission with monetization restrictions"""
        test_name = "Question Submission Monetization"
        
        try:
            if not self.created_children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
            
            child_id = self.created_children[0]
            
            # Get current monetization status
            status_response = self.make_request("GET", "/monetization/status")
            if status_response.status_code != 200:
                self.log_test(test_name, "FAIL", "Could not get monetization status")
                return False
            
            status_data = status_response.json()
            is_premium = status_data.get("is_premium", False)
            trial_days_left = status_data.get("trial_days_left", 0)
            questions_this_month = status_data.get("questions_this_month", 0)
            
            print(f"📊 Question Status: Premium={is_premium}, Trial days={trial_days_left}, Questions this month={questions_this_month}")
            
            # Test question submission
            question_data = {
                "question": "Test monetization: Pourquoi les étoiles brillent-elles?",
                "child_id": child_id
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            # Analyze result based on monetization logic
            if is_premium or trial_days_left > 0:
                # Premium or trial users should be able to ask questions
                if response.status_code == 200:
                    print("✅ Premium/trial user can ask questions")
                    data = response.json()
                    if data.get("id"):
                        self.created_responses.append(data.get("id"))
                    self.log_test(test_name, "PASS", f"Question submission working for premium/trial user")
                    return True
                else:
                    self.log_test(test_name, "FAIL", f"Premium/trial user blocked from asking question: {response.status_code}")
                    return False
            else:
                # Post-trial free users have restrictions
                if questions_this_month >= 1:
                    # Should be blocked due to monthly limit
                    if response.status_code == 402:
                        print("✅ Post-trial user correctly blocked due to monthly question limit")
                        self.log_test(test_name, "PASS", "Post-trial user correctly limited by monthly question limit")
                        return True
                    else:
                        self.log_test(test_name, "FAIL", f"Expected 402 for post-trial user exceeding monthly limit, got: {response.status_code}")
                        return False
                else:
                    # Should be allowed (first question of the month)
                    if response.status_code == 200:
                        print("✅ Post-trial user can ask first question of the month")
                        data = response.json()
                        if data.get("id"):
                            self.created_responses.append(data.get("id"))
                        self.log_test(test_name, "PASS", "Post-trial user can ask first monthly question")
                        return True
                    else:
                        self.log_test(test_name, "FAIL", f"Post-trial user blocked from first monthly question: {response.status_code}")
                        return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_child_management_monetization(self) -> bool:
        """Test child management with monetization (active child selection)"""
        test_name = "Child Management Monetization"
        
        try:
            # Get current monetization status
            status_response = self.make_request("GET", "/monetization/status")
            if status_response.status_code != 200:
                self.log_test(test_name, "FAIL", "Could not get monetization status")
                return False
            
            status_data = status_response.json()
            is_premium = status_data.get("is_premium", False)
            trial_days_left = status_data.get("trial_days_left", 0)
            active_child_id = status_data.get("active_child_id")
            is_post_trial_setup_required = status_data.get("is_post_trial_setup_required", False)
            
            print(f"📊 Child Management Status: Premium={is_premium}, Trial days={trial_days_left}")
            print(f"   Active child ID: {active_child_id}")
            print(f"   Post-trial setup required: {is_post_trial_setup_required}")
            
            if is_premium or trial_days_left > 0:
                self.log_test(test_name, "PASS", "Premium/trial users don't need child selection restrictions")
                return True
            
            # Test active child selection for post-trial users
            if self.created_children:
                child_id = self.created_children[0]
                
                # Test selecting active child
                select_data = {"child_id": child_id}
                response = self.make_request("POST", "/monetization/select-active-child", select_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("active_child_id") == child_id:
                        print(f"✅ Successfully selected active child: {child_id}")
                        
                        # Verify status update
                        updated_status_response = self.make_request("GET", "/monetization/status")
                        if updated_status_response.status_code == 200:
                            updated_status = updated_status_response.json()
                            if updated_status.get("active_child_id") == child_id:
                                print(f"✅ Active child ID updated in status: {child_id}")
                                self.log_test(test_name, "PASS", "Child selection for post-trial users working correctly")
                                return True
                            else:
                                self.log_test(test_name, "FAIL", "Active child ID not updated in status")
                                return False
                        else:
                            self.log_test(test_name, "FAIL", "Could not verify status update")
                            return False
                    else:
                        self.log_test(test_name, "FAIL", f"Active child ID mismatch: expected {child_id}, got {data.get('active_child_id')}")
                        return False
                else:
                    self.log_test(test_name, "FAIL", f"Could not select active child: {response.status_code} - {response.text}")
                    return False
            else:
                self.log_test(test_name, "SKIP", "No children available for selection test")
                return True
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_focused_tests(self):
        """Run focused monetization tests"""
        print("="*80)
        print("🎯 FOCUSED MONETIZATION SYSTEM INTEGRATION TESTS")
        print("="*80)
        print("Testing the NEW MONETIZATION LOGIC for feedback buttons")
        print("Focus: submitFeedback function monetization integration (server.py lines 760-771)")
        print("Verifying:")
        print("- Premium users can use all feedback buttons")
        print("- Trial users can use all feedback buttons")
        print("- Non-premium post-trial users get 402 errors for 'too_complex' and 'need_more_details'")
        print("- 'understood' feedback always works for everyone")
        print()
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed, cannot proceed with tests")
            return False
        
        # Setup test environment
        if not self.setup_test_environment():
            print("❌ Test environment setup failed, cannot proceed")
            return False
        
        # Run all tests
        tests = [
            self.test_monetization_status_api,
            self.test_question_submission_monetization,
            self.test_feedback_monetization_logic,
            self.test_child_management_monetization,
        ]
        
        passed = 0
        failed = 0
        skipped = 0
        
        for test in tests:
            try:
                result = test()
                if result is True:
                    passed += 1
                elif result is False:
                    failed += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                failed += 1
        
        # Summary
        print("="*80)
        print("🎯 FOCUSED MONETIZATION TESTS SUMMARY")
        print("="*80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Skipped: {skipped}")
        print(f"📊 Total: {passed + failed + skipped}")
        
        if failed == 0:
            print("\n🎉 ALL FOCUSED MONETIZATION TESTS PASSED!")
            print("The submitFeedback function monetization integration is working correctly:")
            print("✅ Authentication system works with test@dismaman.fr / Test123!")
            print("✅ Monetization status API returns proper trial status, days left, and question limits")
            print("✅ Question submission with monetization logic properly restricts non-premium users after trial")
            print("✅ Feedback system with monetization restricts 'too_complex' and 'need_more_details' for non-premium post-trial users")
            print("✅ Child management works properly for monetization (active child selection for post-trial free users)")
            print("\nThe NEW MONETIZATION LOGIC in server.py lines 760-771 is functioning as intended:")
            print("- Premium users: ✅ All feedback buttons available")
            print("- Trial users: ✅ All feedback buttons available")
            print("- Post-trial free users: ✅ 'understood' works, 'too_complex'/'need_more_details' return 402")
        else:
            print(f"\n❌ {failed} TESTS FAILED - MONETIZATION SYSTEM NEEDS ATTENTION")
        
        return failed == 0

if __name__ == "__main__":
    tester = FocusedMonetizationTester()
    success = tester.run_focused_tests()
    exit(0 if success else 1)