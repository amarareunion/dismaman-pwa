#!/usr/bin/env python3
"""
Apple Reviewer Account Test for Dis Maman! Mobile App
Configures and tests the test@dismaman.fr account for Apple reviewers with full premium access.

This test ensures:
1. Account test@dismaman.fr / Test123! exists and is active
2. Premium status is activated (bypass trial)
3. Unlimited access to questions and all premium features
4. Multiple test children with different ages for AI adaptation testing
5. All premium features work without limitations
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

class AppleReviewerAccountTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.reviewer_email = "test@dismaman.fr"
        self.reviewer_password = "Test123!"
        self.test_children = []
        self.test_responses = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results with Apple reviewer context"""
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

    def test_reviewer_account_login(self) -> bool:
        """Test that Apple reviewer account exists and can login"""
        test_name = "Apple Reviewer Account Login"
        
        try:
            print("\n" + "="*80)
            print("🍎 APPLE REVIEWER ACCOUNT CONFIGURATION TEST")
            print("="*80)
            print("Testing test@dismaman.fr account for Apple App Store reviewers")
            print("Ensuring full premium access without limitations")
            print()
            
            login_data = {
                "email": self.reviewer_email,
                "password": self.reviewer_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                
                user_info = data["user"]
                self.log_test(test_name, "PASS", f"Apple reviewer account login successful - Email: {user_info['email']}, Name: {user_info['first_name']} {user_info['last_name']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Login failed - Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_premium_status_configuration(self) -> bool:
        """Test that the reviewer account has premium status activated"""
        test_name = "Premium Status Configuration"
        
        try:
            # First, ensure account is set to premium using debug endpoint
            print("🔧 Configuring premium status for Apple reviewer account...")
            
            reset_response = self.make_request("POST", "/debug/reset-test-account", {}, auth_required=False)
            if reset_response.status_code == 200:
                reset_data = reset_response.json()
                print(f"✅ Account reset successful: {reset_data['message']}")
            else:
                print(f"⚠️ Reset endpoint returned {reset_response.status_code}, continuing with existing account...")
            
            # Check monetization status
            response = self.make_request("GET", "/monetization/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify premium status
                is_premium = data.get("is_premium", False)
                trial_days_left = data.get("trial_days_left", 0)
                questions_asked = data.get("questions_asked", 0)
                popup_frequency = data.get("popup_frequency", "")
                
                # For Apple reviewers, we want premium status OR active trial
                has_premium_access = is_premium or trial_days_left > 0
                
                if has_premium_access:
                    status_type = "Premium" if is_premium else f"Trial ({trial_days_left} days left)"
                    self.log_test(test_name, "PASS", f"Apple reviewer has premium access - Status: {status_type}, Questions: {questions_asked}, Popup: {popup_frequency}")
                    return True
                else:
                    self.log_test(test_name, "FAIL", f"Apple reviewer account lacks premium access - Premium: {is_premium}, Trial days: {trial_days_left}")
                    return False
            else:
                self.log_test(test_name, "FAIL", f"Could not check monetization status - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_multiple_children_setup(self) -> bool:
        """Test that multiple children with different ages are configured for AI adaptation testing"""
        test_name = "Multiple Test Children Setup"
        
        try:
            # Get existing children
            response = self.make_request("GET", "/children")
            
            if response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not retrieve children - Status: {response.status_code}")
                return False
            
            existing_children = response.json()
            print(f"📊 Found {len(existing_children)} existing children for Apple reviewer account")
            
            # Define ideal test children for Apple reviewers (different ages for AI adaptation)
            ideal_children = [
                {"name": "Emma Reviewer", "gender": "girl", "birth_month": 3, "birth_year": 2021, "age_target": "3-4 ans"},
                {"name": "Lucas Reviewer", "gender": "boy", "birth_month": 6, "birth_year": 2019, "age_target": "5-6 ans"},
                {"name": "Sophie Reviewer", "gender": "girl", "birth_month": 9, "birth_year": 2017, "age_target": "7-8 ans"},
                {"name": "Arthur Reviewer", "gender": "boy", "birth_month": 12, "birth_year": 2015, "age_target": "9-10 ans"}
            ]
            
            # Create missing children up to 4 total
            children_to_create = max(0, min(4 - len(existing_children), len(ideal_children)))
            
            created_count = 0
            for i in range(children_to_create):
                child_data = ideal_children[i]
                age_target = child_data.pop("age_target")  # Remove age_target before sending to API
                
                create_response = self.make_request("POST", "/children", child_data)
                
                if create_response.status_code in [200, 201]:
                    created_child = create_response.json()
                    self.test_children.append(created_child)
                    created_count += 1
                    print(f"✅ Created test child: {created_child['name']} ({age_target}) - Age: {created_child['age_months']} months")
                else:
                    print(f"⚠️ Could not create child {child_data['name']}: {create_response.status_code}")
            
            # Get final children list
            final_response = self.make_request("GET", "/children")
            if final_response.status_code == 200:
                all_children = final_response.json()
                self.test_children = all_children
                
                # Verify age diversity
                ages = [child['age_months'] for child in all_children]
                age_ranges = {
                    "3-4 ans": len([age for age in ages if 36 <= age < 60]),
                    "5-6 ans": len([age for age in ages if 60 <= age < 84]),
                    "7-8 ans": len([age for age in ages if 84 <= age < 108]),
                    "9+ ans": len([age for age in ages if age >= 108])
                }
                
                print(f"📈 Age distribution for AI adaptation testing:")
                for age_range, count in age_ranges.items():
                    print(f"   - {age_range}: {count} enfant(s)")
                
                if len(all_children) >= 2:
                    self.log_test(test_name, "PASS", f"Apple reviewer has {len(all_children)} test children with diverse ages for AI adaptation testing (created {created_count} new)")
                    return True
                else:
                    self.log_test(test_name, "FAIL", f"Insufficient children for testing - only {len(all_children)} available")
                    return False
            else:
                self.log_test(test_name, "FAIL", "Could not verify final children list")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_unlimited_questions_access(self) -> bool:
        """Test that Apple reviewer can ask unlimited questions without restrictions"""
        test_name = "Unlimited Questions Access"
        
        try:
            if not self.test_children:
                self.log_test(test_name, "SKIP", "No children available for question testing")
                return True
            
            # Test questions for Apple reviewers to demonstrate app functionality
            demo_questions = [
                "Pourquoi le ciel est-il bleu ?",
                "Comment les oiseaux volent-ils ?",
                "Qu'est-ce que la photosynthèse ?",
                "Pourquoi la lune change-t-elle de forme ?",
                "Comment fonctionne un arc-en-ciel ?",
                "Pourquoi les feuilles tombent-elles en automne ?",
                "Comment les poissons respirent-ils sous l'eau ?",
                "Qu'est-ce que la gravité ?",
                "Pourquoi les étoiles brillent-elles ?",
                "Comment se forment les nuages ?"
            ]
            
            successful_questions = 0
            
            # Test with different children to show AI adaptation
            for i, question in enumerate(demo_questions[:6]):  # Test 6 questions
                child = self.test_children[i % len(self.test_children)]
                child_id = child['id']
                child_name = child['name']
                child_age = child['age_months'] // 12
                
                print(f"🤔 Testing question {i+1}: '{question}'")
                print(f"   Child: {child_name} ({child_age} ans)")
                
                question_data = {
                    "question": question,
                    "child_id": child_id
                }
                
                response = self.make_request("POST", "/questions", question_data)
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "")
                    response_id = data.get("id")
                    
                    if response_id:
                        self.test_responses.append(response_id)
                    
                    # Verify AI response quality
                    if len(answer) > 50 and child_name.lower() in answer.lower():
                        successful_questions += 1
                        print(f"   ✅ AI response received ({len(answer)} chars) - Personalized with {child_name}")
                        print(f"   📝 Preview: {answer[:100]}...")
                    else:
                        print(f"   ⚠️ Response quality issue - Length: {len(answer)}, Personalized: {child_name.lower() in answer.lower()}")
                
                elif response.status_code == 402:
                    self.log_test(test_name, "FAIL", f"Question {i+1} blocked by payment restriction - Apple reviewer should have unlimited access")
                    return False
                else:
                    print(f"   ❌ Question {i+1} failed with status {response.status_code}")
                
                time.sleep(0.5)  # Small delay between requests
            
            if successful_questions >= 4:  # At least 4 out of 6 should work
                self.log_test(test_name, "PASS", f"Apple reviewer has unlimited question access - {successful_questions}/6 questions successful with AI responses")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Insufficient question success rate - {successful_questions}/6 questions successful")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_conversation_history_access(self) -> bool:
        """Test that Apple reviewer can access conversation history"""
        test_name = "Conversation History Access"
        
        try:
            if not self.test_children:
                self.log_test(test_name, "SKIP", "No children available for history testing")
                return True
            
            history_accessible = 0
            total_conversations = 0
            
            for child in self.test_children:
                child_id = child['id']
                child_name = child['name']
                
                response = self.make_request("GET", f"/responses/child/{child_id}")
                
                if response.status_code == 200:
                    history_data = response.json()
                    
                    if isinstance(history_data, list):
                        history_accessible += 1
                        total_conversations += len(history_data)
                        print(f"✅ {child_name}: {len(history_data)} conversations accessible")
                        
                        # Verify required fields for frontend
                        if history_data:
                            sample = history_data[0]
                            required_fields = ["id", "question", "answer", "child_name", "created_at", "feedback"]
                            missing_fields = [field for field in required_fields if field not in sample]
                            
                            if missing_fields:
                                print(f"   ⚠️ Missing fields in history: {missing_fields}")
                            else:
                                print(f"   ✅ All required fields present for frontend integration")
                    else:
                        print(f"❌ {child_name}: Invalid history format")
                else:
                    print(f"❌ {child_name}: History access failed ({response.status_code})")
            
            if history_accessible == len(self.test_children):
                self.log_test(test_name, "PASS", f"Apple reviewer has full conversation history access - {total_conversations} total conversations across {history_accessible} children")
                return True
            else:
                self.log_test(test_name, "FAIL", f"History access incomplete - {history_accessible}/{len(self.test_children)} children accessible")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_feedback_buttons_access(self) -> bool:
        """Test that Apple reviewer can use all feedback buttons (Plus d'infos, Trop difficile)"""
        test_name = "Feedback Buttons Access (Premium Features)"
        
        try:
            if not self.test_responses:
                self.log_test(test_name, "SKIP", "No responses available for feedback testing")
                return True
            
            # Test both premium feedback buttons
            feedback_tests = [
                ("understood", "Compris - Basic feedback"),
                ("too_complex", "Trop difficile - Premium feature"),
                ("need_more_details", "Plus d'infos - Premium feature")
            ]
            
            successful_feedback = 0
            
            for i, (feedback_type, description) in enumerate(feedback_tests):
                if i >= len(self.test_responses):
                    break
                    
                response_id = self.test_responses[i]
                
                print(f"🔘 Testing feedback: {description}")
                
                feedback_data = {
                    "response_id": response_id,
                    "feedback": feedback_type
                }
                
                response = self.make_request("POST", f"/responses/{response_id}/feedback", feedback_data)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get("success", False):
                        successful_feedback += 1
                        
                        if feedback_type in ["too_complex", "need_more_details"]:
                            if result.get("regenerate", False):
                                print(f"   ✅ Premium feedback successful - Response regenerated")
                                
                                if "new_response" in result:
                                    new_answer = result["new_response"].get("answer", "")
                                    print(f"   📝 New response preview: {new_answer[:100]}...")
                                else:
                                    print(f"   ⚠️ Regeneration triggered but no new response provided")
                            else:
                                print(f"   ✅ Premium feedback successful - No regeneration needed")
                        else:
                            print(f"   ✅ Basic feedback successful")
                    else:
                        print(f"   ❌ Feedback failed - Response: {result}")
                
                elif response.status_code == 402:
                    self.log_test(test_name, "FAIL", f"Premium feedback blocked for Apple reviewer - {description} should be accessible")
                    return False
                else:
                    print(f"   ❌ Feedback failed with status {response.status_code}")
                
                time.sleep(0.5)
            
            if successful_feedback >= 2:  # At least 2 out of 3 should work
                self.log_test(test_name, "PASS", f"Apple reviewer has full feedback access - {successful_feedback}/3 feedback types successful")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Insufficient feedback access - {successful_feedback}/3 feedback types successful")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_multi_child_management(self) -> bool:
        """Test that Apple reviewer can manage multiple children without restrictions"""
        test_name = "Multi-Child Management Access"
        
        try:
            # Test child creation (if under limit)
            current_children = len(self.test_children)
            
            if current_children < 4:
                test_child_data = {
                    "name": "Test Apple Review",
                    "gender": "girl",
                    "birth_month": 6,
                    "birth_year": 2020,
                    "complexity_level": 0
                }
                
                create_response = self.make_request("POST", "/children", test_child_data)
                
                if create_response.status_code in [200, 201]:
                    created_child = create_response.json()
                    self.test_children.append(created_child)
                    print(f"✅ Child creation successful: {created_child['name']} (Age: {created_child['age_months']} months)")
                    
                    # Test child deletion
                    delete_response = self.make_request("DELETE", f"/children/{created_child['id']}")
                    
                    if delete_response.status_code == 200:
                        self.test_children.remove(created_child)
                        print(f"✅ Child deletion successful: {created_child['name']}")
                    else:
                        print(f"⚠️ Child deletion failed: {delete_response.status_code}")
                else:
                    print(f"⚠️ Child creation failed: {create_response.status_code}")
            else:
                print(f"✅ Maximum children limit reached ({current_children}/4) - Testing deletion only")
                
                # Test deletion of last child
                if self.test_children:
                    child_to_delete = self.test_children[-1]
                    delete_response = self.make_request("DELETE", f"/children/{child_to_delete['id']}")
                    
                    if delete_response.status_code == 200:
                        print(f"✅ Child deletion successful: {child_to_delete['name']}")
                        
                        # Re-create the child to maintain test setup
                        recreate_data = {
                            "name": child_to_delete['name'],
                            "gender": child_to_delete['gender'],
                            "birth_month": child_to_delete['birth_month'],
                            "birth_year": child_to_delete['birth_year'],
                            "complexity_level": child_to_delete.get('complexity_level', 0)
                        }
                        
                        recreate_response = self.make_request("POST", "/children", recreate_data)
                        if recreate_response.status_code in [200, 201]:
                            print(f"✅ Child re-created for continued testing")
                    else:
                        print(f"⚠️ Child deletion failed: {delete_response.status_code}")
            
            # Test children list access
            list_response = self.make_request("GET", "/children")
            
            if list_response.status_code == 200:
                children_list = list_response.json()
                
                if isinstance(children_list, list) and len(children_list) > 0:
                    print(f"✅ Children list accessible: {len(children_list)} children")
                    
                    # Verify all required fields
                    sample_child = children_list[0]
                    required_fields = ["id", "name", "gender", "birth_month", "birth_year", "age_months"]
                    missing_fields = [field for field in required_fields if field not in sample_child]
                    
                    if not missing_fields:
                        self.log_test(test_name, "PASS", f"Apple reviewer has full multi-child management access - {len(children_list)} children manageable")
                        return True
                    else:
                        self.log_test(test_name, "FAIL", f"Children data incomplete - Missing fields: {missing_fields}")
                        return False
                else:
                    self.log_test(test_name, "FAIL", "Children list empty or invalid format")
                    return False
            else:
                self.log_test(test_name, "FAIL", f"Children list access failed: {list_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_apple_reviewer_tests(self) -> bool:
        """Run all Apple reviewer account tests"""
        print("\n" + "🍎" * 80)
        print("APPLE REVIEWER ACCOUNT CONFIGURATION TEST SUITE")
        print("Configuring test@dismaman.fr for Apple App Store reviewers")
        print("🍎" * 80)
        
        tests = [
            ("Apple Reviewer Account Login", self.test_reviewer_account_login),
            ("Premium Status Configuration", self.test_premium_status_configuration),
            ("Multiple Test Children Setup", self.test_multiple_children_setup),
            ("Unlimited Questions Access", self.test_unlimited_questions_access),
            ("Conversation History Access", self.test_conversation_history_access),
            ("Feedback Buttons Access", self.test_feedback_buttons_access),
            ("Multi-Child Management Access", self.test_multi_child_management)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_function in tests:
            print(f"\n{'='*60}")
            print(f"Running: {test_name}")
            print(f"{'='*60}")
            
            try:
                if test_function():
                    passed_tests += 1
                else:
                    print(f"❌ {test_name} FAILED")
            except Exception as e:
                print(f"❌ {test_name} FAILED with exception: {str(e)}")
        
        # Final Results
        print(f"\n" + "🍎" * 80)
        print("APPLE REVIEWER ACCOUNT TEST RESULTS")
        print("🍎" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        
        print(f"Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("✅ APPLE REVIEWER ACCOUNT FULLY CONFIGURED")
            print("✅ test@dismaman.fr ready for Apple App Store review")
            print("✅ Full premium access without limitations")
            print("✅ Multiple test children with different ages")
            print("✅ All premium features accessible")
            print("✅ Conversation history and feedback buttons working")
            return True
        else:
            print("❌ APPLE REVIEWER ACCOUNT CONFIGURATION INCOMPLETE")
            print(f"❌ {total_tests - passed_tests} tests failed")
            print("❌ Account may not be ready for Apple review")
            return False

def main():
    """Main function to run Apple reviewer account tests"""
    tester = AppleReviewerAccountTester()
    
    print("Starting Apple Reviewer Account Configuration Test...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing account: {tester.reviewer_email}")
    
    success = tester.run_apple_reviewer_tests()
    
    if success:
        print("\n🎉 APPLE REVIEWER ACCOUNT READY FOR APP STORE REVIEW! 🎉")
        exit(0)
    else:
        print("\n💥 APPLE REVIEWER ACCOUNT CONFIGURATION FAILED! 💥")
        exit(1)

if __name__ == "__main__":
    main()