#!/usr/bin/env python3
"""
Final Animation Test for Dis Maman! Backend
Tests the three specific areas requested:
1. Child creation with complexity_level default (0)
2. Child deletion functionality
3. Sophisticated AI system with GPT-4o
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

class FinalAnimationTester:
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
        """Authenticate with test user"""
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
                print(f"✅ Authentication successful with {self.test_user_email}")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication exception: {str(e)}")
            return False

    def test_child_creation_with_complexity_level(self) -> bool:
        """Test 1: Create child with complexity_level default (0) - Animation Test, boy, December 2019"""
        test_name = "Child Creation with Complexity Level"
        
        try:
            print("\n" + "="*60)
            print("🧒 TEST 1: CHILD CREATION WITH COMPLEXITY_LEVEL")
            print("="*60)
            
            # Create child as requested: "Animation Test", "boy", December 2019
            child_data = {
                "name": "Animation Test",
                "gender": "boy",
                "birth_month": 12,
                "birth_year": 2019,
                "complexity_level": 0  # Default value
            }
            
            print(f"Creating child: {child_data}")
            response = self.make_request("POST", "/children", child_data)
            
            if response.status_code not in [200, 201]:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            child_id = data.get("id")
            
            if not child_id:
                self.log_test(test_name, "FAIL", f"No child ID in response: {data}")
                return False
            
            self.created_children.append(child_id)
            
            # Verify all required fields are present and correct
            required_fields = ["id", "name", "gender", "birth_month", "birth_year", "complexity_level", "age_months", "parent_id"]
            for field in required_fields:
                if field not in data:
                    self.log_test(test_name, "FAIL", f"Missing field '{field}' in response")
                    return False
            
            # Verify specific values
            if data["name"] != "Animation Test":
                self.log_test(test_name, "FAIL", f"Expected name 'Animation Test', got '{data['name']}'")
                return False
            
            if data["gender"] != "boy":
                self.log_test(test_name, "FAIL", f"Expected gender 'boy', got '{data['gender']}'")
                return False
            
            if data["birth_month"] != 12:
                self.log_test(test_name, "FAIL", f"Expected birth_month 12, got {data['birth_month']}")
                return False
            
            if data["birth_year"] != 2019:
                self.log_test(test_name, "FAIL", f"Expected birth_year 2019, got {data['birth_year']}")
                return False
            
            if data["complexity_level"] != 0:
                self.log_test(test_name, "FAIL", f"Expected complexity_level 0, got {data['complexity_level']}")
                return False
            
            # Calculate expected age (December 2019 to current date)
            now = datetime.now()
            expected_age_months = (now.year - 2019) * 12 + (now.month - 12)
            if abs(data["age_months"] - expected_age_months) > 1:  # Allow 1 month tolerance
                self.log_test(test_name, "FAIL", f"Age calculation incorrect: expected ~{expected_age_months}, got {data['age_months']}")
                return False
            
            print(f"✅ Child created successfully:")
            print(f"   - ID: {child_id}")
            print(f"   - Name: {data['name']}")
            print(f"   - Gender: {data['gender']}")
            print(f"   - Birth: {data['birth_month']}/{data['birth_year']}")
            print(f"   - Complexity Level: {data['complexity_level']}")
            print(f"   - Age: {data['age_months']} months")
            print(f"   - Parent ID: {data['parent_id']}")
            
            self.log_test(test_name, "PASS", f"Child 'Animation Test' created with complexity_level 0, age {data['age_months']} months")
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_child_deletion_comprehensive(self) -> bool:
        """Test 2: Comprehensive child deletion functionality"""
        test_name = "Child Deletion Comprehensive"
        
        try:
            print("\n" + "="*60)
            print("🗑️  TEST 2: COMPREHENSIVE CHILD DELETION")
            print("="*60)
            
            # Step 1: List existing children
            print("Step 1: Listing existing children...")
            children_response = self.make_request("GET", "/children")
            
            if children_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not list children: {children_response.status_code}")
                return False
            
            children_before = children_response.json()
            print(f"✅ Found {len(children_before)} existing children:")
            for child in children_before:
                print(f"   - {child['name']} (ID: {child['id']}, Gender: {child['gender']}, Age: {child['age_months']} months)")
            
            if len(children_before) == 0:
                self.log_test(test_name, "FAIL", "No children available for deletion test")
                return False
            
            # Step 2: Delete a specific child
            child_to_delete = children_before[0]  # Delete the first child
            child_id = child_to_delete['id']
            child_name = child_to_delete['name']
            
            print(f"\nStep 2: Deleting child '{child_name}' (ID: {child_id})...")
            delete_response = self.make_request("DELETE", f"/children/{child_id}")
            
            # Step 3: Verify deletion was successful (200 OK)
            if delete_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Deletion failed with status {delete_response.status_code}: {delete_response.text}")
                return False
            
            print(f"✅ Deletion successful (Status: {delete_response.status_code})")
            
            # Verify response message
            delete_data = delete_response.json()
            if "message" not in delete_data or "deleted successfully" not in delete_data["message"]:
                self.log_test(test_name, "FAIL", f"Unexpected deletion response: {delete_data}")
                return False
            
            print(f"✅ Deletion message: {delete_data['message']}")
            
            # Step 4: Verify child no longer appears in list
            print(f"\nStep 3: Verifying child '{child_name}' no longer appears in list...")
            children_after_response = self.make_request("GET", "/children")
            
            if children_after_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not list children after deletion: {children_after_response.status_code}")
                return False
            
            children_after = children_after_response.json()
            print(f"✅ Children list retrieved: {len(children_after)} children found")
            
            # Verify the deleted child is not in the list
            deleted_child_still_exists = any(child['id'] == child_id for child in children_after)
            if deleted_child_still_exists:
                self.log_test(test_name, "FAIL", f"Child '{child_name}' still exists after deletion")
                return False
            
            print(f"✅ Confirmed: Child '{child_name}' no longer appears in children list")
            
            # Verify count decreased correctly
            if len(children_after) != len(children_before) - 1:
                self.log_test(test_name, "FAIL", f"Children count mismatch: before={len(children_before)}, after={len(children_after)}")
                return False
            
            print(f"✅ Children count correctly decreased from {len(children_before)} to {len(children_after)}")
            
            self.log_test(test_name, "PASS", f"Child deletion successful: '{child_name}' deleted and verified absent from list")
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_sophisticated_ai_system(self) -> bool:
        """Test 3: Sophisticated AI system with GPT-4o"""
        test_name = "Sophisticated AI System with GPT-4o"
        
        try:
            print("\n" + "="*60)
            print("🧠 TEST 3: SOPHISTICATED AI SYSTEM WITH GPT-4o")
            print("="*60)
            
            if not self.created_children:
                self.log_test(test_name, "FAIL", "No children available for AI testing")
                return False
            
            child_id = self.created_children[0]
            
            # Step 1: Ask a simple question
            print("Step 1: Asking simple question to AI...")
            question_data = {
                "question": "Pourquoi le ciel est bleu ?",
                "child_id": child_id
            }
            
            print(f"Question: {question_data['question']}")
            print(f"Child ID: {child_id}")
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Question failed with status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            answer = data.get("answer", "")
            child_name = data.get("child_name", "")
            response_id = data.get("id")
            
            print(f"✅ AI response received (ID: {response_id})")
            
            # Step 2: Verify GPT-4o is being used (not fallback)
            print("\nStep 2: Verifying GPT-4o usage...")
            if "je n'ai pas pu répondre" in answer.lower() or "redemander" in answer.lower():
                self.log_test(test_name, "FAIL", "Received fallback response instead of GPT-4o response")
                return False
            
            print("✅ GPT-4o is being used (no fallback response detected)")
            
            # Step 3: Verify sophisticated prompting system
            print("\nStep 3: Verifying sophisticated prompting system...")
            
            # Check for scientific explanation keywords
            sky_keywords = ["bleu", "lumière", "soleil", "air", "particules", "diffusion", "rayons", "couleur"]
            if not any(keyword in answer.lower() for keyword in sky_keywords):
                self.log_test(test_name, "FAIL", f"Response lacks scientific explanation keywords: {answer}")
                return False
            
            print("✅ Response contains proper scientific terminology")
            
            # Step 4: Verify child's name is used in response (personalization)
            print(f"\nStep 4: Verifying personalization with child's name '{child_name}'...")
            if child_name and child_name.lower() not in answer.lower():
                self.log_test(test_name, "FAIL", f"Response doesn't use child's name '{child_name}': {answer}")
                return False
            
            print(f"✅ Response uses child's name '{child_name}' for personalization")
            
            # Display the full response
            print(f"\n📝 Full AI Response:")
            print(f"Question: {question_data['question']}")
            print(f"Child: {child_name}")
            print(f"Answer: {answer}")
            
            self.created_responses.append(response_id)
            
            self.log_test(test_name, "PASS", f"GPT-4o sophisticated AI system working: personalized response for '{child_name}' with scientific explanation")
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_final_animation_tests(self) -> Dict[str, bool]:
        """Run the three specific tests requested for animation readiness"""
        print("=" * 80)
        print("FINAL ANIMATION TESTS FOR DIS MAMAN! BACKEND")
        print("Testing child functionality with animations readiness")
        print(f"Backend URL: {API_BASE}")
        print("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return {"authentication": False}
        
        test_results = {}
        
        # Test 1: Child creation with complexity_level
        test_results["child_creation_complexity"] = self.test_child_creation_with_complexity_level()
        
        # Test 2: Child deletion
        test_results["child_deletion"] = self.test_child_deletion_comprehensive()
        
        # Test 3: Sophisticated AI system
        test_results["sophisticated_ai"] = self.test_sophisticated_ai_system()
        
        # Summary
        print("\n" + "=" * 80)
        print("FINAL ANIMATION TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print()
        print(f"OVERALL RESULT: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL ANIMATION TESTS PASSED!")
            print("✅ Backend is 100% ready for new frontend animations")
        else:
            print("⚠️  Some animation tests failed. Backend needs fixes before animation deployment.")
        
        return test_results

def main():
    """Main test execution function"""
    tester = FinalAnimationTester()
    results = tester.run_final_animation_tests()
    
    # Return exit code based on test results
    failed_tests = [name for name, result in results.items() if not result]
    if failed_tests:
        print(f"\nFailed tests: {', '.join(failed_tests)}")
        return 1
    return 0

if __name__ == "__main__":
    exit(main())