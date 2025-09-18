#!/usr/bin/env python3
"""
Specific test for child creation with complexity_level field
Testing the new modifications as requested in the review.
"""

import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class ChildCreationTester:
    def __init__(self):
        self.access_token = None
        self.test_user_email = "test@dismaman.fr"
        self.test_user_password = "Test123!"
        self.created_children = []
        
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
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def authenticate(self) -> bool:
        """Authenticate with test user credentials"""
        test_name = "Authentication"
        
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.log_test(test_name, "PASS", f"Authenticated as {self.test_user_email}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def get_existing_children_count(self) -> int:
        """Get count of existing children"""
        try:
            response = self.make_request("GET", "/children")
            if response.status_code == 200:
                children = response.json()
                return len(children)
            return 0
        except:
            return 0

    def test_create_boy_november_2020(self) -> bool:
        """Test creating a boy born in November 2020 with complexity_level 0"""
        test_name = "Create Boy November 2020 with complexity_level"
        
        try:
            child_data = {
                "name": "Test Garcon",
                "gender": "boy",
                "birth_month": 11,
                "birth_year": 2020,
                "complexity_level": 0
            }
            
            response = self.make_request("POST", "/children", child_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = ["id", "name", "gender", "birth_month", "birth_year", "complexity_level", "age_months", "parent_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(test_name, "FAIL", f"Missing fields in response: {missing_fields}")
                    return False
                
                # Verify the data matches what we sent
                if data["name"] != child_data["name"]:
                    self.log_test(test_name, "FAIL", f"Name mismatch: expected '{child_data['name']}', got '{data['name']}'")
                    return False
                
                if data["gender"] != child_data["gender"]:
                    self.log_test(test_name, "FAIL", f"Gender mismatch: expected '{child_data['gender']}', got '{data['gender']}'")
                    return False
                
                if data["birth_month"] != child_data["birth_month"]:
                    self.log_test(test_name, "FAIL", f"Birth month mismatch: expected {child_data['birth_month']}, got {data['birth_month']}")
                    return False
                
                if data["birth_year"] != child_data["birth_year"]:
                    self.log_test(test_name, "FAIL", f"Birth year mismatch: expected {child_data['birth_year']}, got {data['birth_year']}")
                    return False
                
                if data["complexity_level"] != child_data["complexity_level"]:
                    self.log_test(test_name, "FAIL", f"Complexity level mismatch: expected {child_data['complexity_level']}, got {data['complexity_level']}")
                    return False
                
                # Verify age calculation (November 2020 to current date)
                current_date = datetime.now()
                expected_age_months = (current_date.year - 2020) * 12 + (current_date.month - 11)
                if expected_age_months < 0:
                    expected_age_months = 0
                
                if abs(data["age_months"] - expected_age_months) > 1:  # Allow 1 month tolerance
                    self.log_test(test_name, "FAIL", f"Age calculation error: expected ~{expected_age_months} months, got {data['age_months']}")
                    return False
                
                self.created_children.append(data["id"])
                self.log_test(test_name, "PASS", f"Child created successfully - ID: {data['id']}, Age: {data['age_months']} months, Complexity: {data['complexity_level']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_verify_child_in_list(self) -> bool:
        """Verify the created child appears in the children list"""
        test_name = "Verify Child in List"
        
        try:
            response = self.make_request("GET", "/children")
            
            if response.status_code == 200:
                children = response.json()
                
                if not self.created_children:
                    self.log_test(test_name, "SKIP", "No children created to verify")
                    return True
                
                created_child_id = self.created_children[0]
                found_child = None
                
                for child in children:
                    if child.get("id") == created_child_id:
                        found_child = child
                        break
                
                if not found_child:
                    self.log_test(test_name, "FAIL", f"Created child {created_child_id} not found in children list")
                    return False
                
                # Verify the child has the correct data
                if found_child["name"] != "Test Garcon":
                    self.log_test(test_name, "FAIL", f"Child name mismatch in list: expected 'Test Garcon', got '{found_child['name']}'")
                    return False
                
                if found_child["gender"] != "boy":
                    self.log_test(test_name, "FAIL", f"Child gender mismatch in list: expected 'boy', got '{found_child['gender']}'")
                    return False
                
                if found_child["complexity_level"] != 0:
                    self.log_test(test_name, "FAIL", f"Child complexity_level mismatch in list: expected 0, got {found_child['complexity_level']}")
                    return False
                
                self.log_test(test_name, "PASS", f"Child found in list with correct data - complexity_level: {found_child['complexity_level']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_four_children_limit(self) -> bool:
        """Test the 4 children limit"""
        test_name = "Four Children Limit"
        
        try:
            # Get current children count
            current_count = self.get_existing_children_count()
            
            # Create children up to the limit
            children_to_create = max(0, 4 - current_count)
            
            for i in range(children_to_create):
                child_data = {
                    "name": f"Limit Test Child {i+1}",
                    "gender": "girl" if i % 2 == 0 else "boy",
                    "birth_month": (i % 12) + 1,
                    "birth_year": 2019 + i,
                    "complexity_level": 0
                }
                
                response = self.make_request("POST", "/children", child_data)
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.created_children.append(data["id"])
                else:
                    self.log_test(test_name, "FAIL", f"Failed to create child {i+1}: {response.status_code}")
                    return False
            
            # Now try to create the 5th child - should fail
            excess_child_data = {
                "name": "Fifth Child Should Fail",
                "gender": "boy",
                "birth_month": 12,
                "birth_year": 2021,
                "complexity_level": 0
            }
            
            response = self.make_request("POST", "/children", excess_child_data)
            
            if response.status_code == 400:
                response_text = response.text.lower()
                if "maximum" in response_text and "4" in response_text and "children" in response_text:
                    self.log_test(test_name, "PASS", "Correctly rejected 5th child with proper error message")
                    return True
                else:
                    self.log_test(test_name, "FAIL", f"Wrong error message for 5th child: {response.text}")
                    return False
            else:
                self.log_test(test_name, "FAIL", f"Expected 400 error for 5th child, got: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_complexity_level_validation(self) -> bool:
        """Test complexity_level field validation"""
        test_name = "Complexity Level Validation"
        
        try:
            # Test valid complexity levels (-2 to 2)
            valid_levels = [-2, -1, 0, 1, 2]
            
            for level in valid_levels:
                child_data = {
                    "name": f"Complexity Test {level}",
                    "gender": "boy",
                    "birth_month": 6,
                    "birth_year": 2020,
                    "complexity_level": level
                }
                
                response = self.make_request("POST", "/children", child_data)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data["complexity_level"] != level:
                        self.log_test(test_name, "FAIL", f"Complexity level {level} not preserved: got {data['complexity_level']}")
                        return False
                    # Clean up - delete the test child
                    self.make_request("DELETE", f"/children/{data['id']}")
                elif response.status_code == 400 and "Maximum 4 children" in response.text:
                    # Hit the limit, that's okay for this test
                    self.log_test(test_name, "SKIP", f"Hit 4 children limit during complexity validation test")
                    return True
                else:
                    self.log_test(test_name, "FAIL", f"Valid complexity level {level} rejected: {response.status_code}")
                    return False
            
            self.log_test(test_name, "PASS", "All valid complexity levels (-2 to 2) accepted and preserved")
            return True
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_child_creation_tests(self):
        """Run all child creation tests"""
        print("=" * 80)
        print("CHILD CREATION TESTS WITH COMPLEXITY_LEVEL")
        print(f"Backend URL: {API_BASE}")
        print(f"Test User: {self.test_user_email}")
        print("=" * 80)
        print()
        
        test_results = {}
        
        # Authentication
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Get initial children count
        initial_count = self.get_existing_children_count()
        print(f"📊 Initial children count: {initial_count}")
        print()
        
        # Run tests
        print("🧒 CHILD CREATION TESTS")
        print("-" * 40)
        test_results["create_boy_november_2020"] = self.test_create_boy_november_2020()
        test_results["verify_child_in_list"] = self.test_verify_child_in_list()
        test_results["complexity_level_validation"] = self.test_complexity_level_validation()
        test_results["four_children_limit"] = self.test_four_children_limit()
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print()
        print(f"OVERALL RESULT: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL CHILD CREATION TESTS PASSED!")
            print("✅ Child creation with complexity_level field is working correctly")
            print("✅ Boy born in November 2020 created successfully")
            print("✅ complexity_level properly set to 0")
            print("✅ 4 children limit properly enforced")
        else:
            print("⚠️  Some tests failed. Please check the details above.")
        
        return test_results

def main():
    """Main test execution function"""
    tester = ChildCreationTester()
    results = tester.run_child_creation_tests()
    
    # Return exit code based on test results
    failed_tests = [name for name, result in results.items() if not result]
    if failed_tests:
        print(f"\nFailed tests: {', '.join(failed_tests)}")
        return 1
    return 0

if __name__ == "__main__":
    exit(main())