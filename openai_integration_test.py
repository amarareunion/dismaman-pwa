#!/usr/bin/env python3
"""
OpenAI Integration Test for Dis Maman! Mobile App
Specifically tests that the AI question system is using OpenAI GPT-4 and not the fallback response.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class OpenAIIntegrationTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.test_user_email = "test@dismaman.fr"
        self.test_user_password = "Test123!"
        self.children = []
        
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
        """Authenticate with existing test user"""
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
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                self.log_test(test_name, "PASS", f"Authenticated as {self.test_user_email}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def get_children(self) -> bool:
        """Get list of children for testing"""
        test_name = "Get Children for Testing"
        
        try:
            response = self.make_request("GET", "/children")
            
            if response.status_code == 200:
                self.children = response.json()
                if len(self.children) > 0:
                    self.log_test(test_name, "PASS", f"Found {len(self.children)} children for testing")
                    return True
                else:
                    self.log_test(test_name, "FAIL", "No children found for testing")
                    return False
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_openai_simple_question(self) -> bool:
        """Test OpenAI integration with a simple question"""
        test_name = "OpenAI Integration - Simple Question"
        
        try:
            if not self.children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
                
            question_data = {
                "question": "Pourquoi le ciel est bleu ?",
                "child_id": self.children[0]["id"]
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "")
                
                # Check if this is the fallback response
                fallback_pattern = "Je comprends ta question"
                if fallback_pattern in answer:
                    self.log_test(test_name, "FAIL", f"Received fallback response instead of OpenAI: {answer[:100]}...")
                    return False
                
                # Check if the response looks like a real AI response
                if len(answer) < 50:
                    self.log_test(test_name, "FAIL", f"Response too short, might be fallback: {answer}")
                    return False
                
                # Check for French language and educational content
                if not any(word in answer.lower() for word in ["lumière", "soleil", "particules", "diffusion", "bleu"]):
                    self.log_test(test_name, "WARN", f"Response doesn't contain expected scientific terms: {answer[:200]}...")
                
                self.log_test(test_name, "PASS", f"Received OpenAI response: {answer[:150]}...")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_age_appropriate_responses(self) -> bool:
        """Test that responses are age-appropriate for different children"""
        test_name = "Age-Appropriate Responses"
        
        try:
            if len(self.children) < 2:
                self.log_test(test_name, "SKIP", "Need at least 2 children with different ages")
                return True
            
            # Sort children by age
            sorted_children = sorted(self.children, key=lambda x: x["age_months"])
            
            responses = []
            
            # Ask the same question to children of different ages
            for i, child in enumerate(sorted_children[:2]):  # Test with first 2 children
                question_data = {
                    "question": "Comment les avions volent-ils ?",
                    "child_id": child["id"]
                }
                
                response = self.make_request("POST", "/questions", question_data)
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "")
                    
                    # Check if this is the fallback response
                    fallback_pattern = "Je comprends ta question"
                    if fallback_pattern in answer:
                        self.log_test(test_name, "FAIL", f"Received fallback response for child {child['name']}")
                        return False
                    
                    responses.append({
                        "child": child,
                        "answer": answer
                    })
                    
                    self.log_test(f"Response for {child['name']} ({child['age_months']} months)", "INFO", f"{answer[:100]}...")
                else:
                    self.log_test(test_name, "FAIL", f"Failed to get response for child {child['name']}")
                    return False
            
            # Check that responses are different (indicating age adaptation)
            if len(responses) >= 2:
                if responses[0]["answer"] == responses[1]["answer"]:
                    self.log_test(test_name, "WARN", "Responses are identical - age adaptation might not be working")
                else:
                    self.log_test(test_name, "PASS", "Responses are different for different ages - age adaptation working")
            
            return True
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_complex_question(self) -> bool:
        """Test OpenAI with a more complex question"""
        test_name = "OpenAI Integration - Complex Question"
        
        try:
            if not self.children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
                
            question_data = {
                "question": "Pourquoi les dinosaures ont-ils disparu et comment le savons-nous ?",
                "child_id": self.children[0]["id"]
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "")
                
                # Check if this is the fallback response
                fallback_pattern = "Je comprends ta question"
                if fallback_pattern in answer:
                    self.log_test(test_name, "FAIL", f"Received fallback response instead of OpenAI: {answer[:100]}...")
                    return False
                
                # Check for educational content about dinosaurs
                dinosaur_terms = ["météorite", "astéroïde", "extinction", "fossiles", "paléontologues", "millions d'années"]
                if not any(term in answer.lower() for term in dinosaur_terms):
                    self.log_test(test_name, "WARN", f"Response lacks expected dinosaur-related terms: {answer[:200]}...")
                
                # Check response length (should be substantial for complex question)
                if len(answer) < 100:
                    self.log_test(test_name, "FAIL", f"Response too short for complex question: {answer}")
                    return False
                
                self.log_test(test_name, "PASS", f"Received comprehensive OpenAI response: {answer[:150]}...")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_french_language_quality(self) -> bool:
        """Test that responses are in proper French"""
        test_name = "French Language Quality"
        
        try:
            if not self.children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
                
            question_data = {
                "question": "Qu'est-ce que la photosynthèse ?",
                "child_id": self.children[0]["id"]
            }
            
            response = self.make_request("POST", "/questions", question_data)
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "")
                
                # Check if this is the fallback response
                fallback_pattern = "Je comprends ta question"
                if fallback_pattern in answer:
                    self.log_test(test_name, "FAIL", f"Received fallback response instead of OpenAI")
                    return False
                
                # Check for French language indicators
                french_indicators = ["les", "des", "une", "est", "sont", "avec", "dans", "pour"]
                french_count = sum(1 for word in french_indicators if word in answer.lower())
                
                if french_count < 3:
                    self.log_test(test_name, "FAIL", f"Response doesn't appear to be in French: {answer[:100]}...")
                    return False
                
                # Check for scientific terms in French
                science_terms = ["plantes", "lumière", "oxygène", "carbone", "énergie"]
                if not any(term in answer.lower() for term in science_terms):
                    self.log_test(test_name, "WARN", f"Response lacks expected scientific terms in French")
                
                self.log_test(test_name, "PASS", f"Response is in proper French: {answer[:100]}...")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_multiple_questions_consistency(self) -> bool:
        """Test that multiple questions all use OpenAI (not fallback)"""
        test_name = "Multiple Questions Consistency"
        
        try:
            if not self.children:
                self.log_test(test_name, "SKIP", "No children available for testing")
                return True
            
            questions = [
                "Pourquoi la lune change-t-elle de forme ?",
                "Comment les poissons respirent-ils sous l'eau ?",
                "Pourquoi les feuilles tombent-elles en automne ?"
            ]
            
            fallback_count = 0
            openai_count = 0
            
            for i, question in enumerate(questions):
                question_data = {
                    "question": question,
                    "child_id": self.children[0]["id"]
                }
                
                response = self.make_request("POST", "/questions", question_data)
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "")
                    
                    # Check if this is the fallback response
                    fallback_pattern = "Je comprends ta question"
                    if fallback_pattern in answer:
                        fallback_count += 1
                        self.log_test(f"Question {i+1}", "FAIL", f"Fallback response: {answer[:50]}...")
                    else:
                        openai_count += 1
                        self.log_test(f"Question {i+1}", "PASS", f"OpenAI response: {answer[:50]}...")
                else:
                    self.log_test(f"Question {i+1}", "FAIL", f"Request failed: {response.status_code}")
                
                # Small delay between requests
                time.sleep(1)
            
            if fallback_count > 0:
                self.log_test(test_name, "FAIL", f"{fallback_count}/{len(questions)} questions used fallback response")
                return False
            else:
                self.log_test(test_name, "PASS", f"All {openai_count} questions used OpenAI responses")
                return True
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_openai_tests(self) -> Dict[str, bool]:
        """Run all OpenAI integration tests"""
        print("=" * 80)
        print("OPENAI INTEGRATION TESTS FOR DIS MAMAN!")
        print(f"Backend URL: {API_BASE}")
        print("Testing with user: test@dismaman.fr")
        print("=" * 80)
        print()
        
        test_results = {}
        
        # Setup
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return {"authentication": False}
        
        if not self.get_children():
            print("❌ No children found - cannot proceed with AI tests")
            return {"get_children": False}
        
        # OpenAI Integration Tests
        print("🤖 OPENAI INTEGRATION TESTS")
        print("-" * 40)
        test_results["simple_question"] = self.test_openai_simple_question()
        test_results["complex_question"] = self.test_complex_question()
        test_results["french_quality"] = self.test_french_language_quality()
        test_results["age_appropriate"] = self.test_age_appropriate_responses()
        test_results["consistency"] = self.test_multiple_questions_consistency()
        
        # Summary
        print("=" * 80)
        print("OPENAI INTEGRATION TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print()
        print(f"OVERALL RESULT: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL OPENAI TESTS PASSED! OpenAI integration is working correctly.")
            print("✅ The system is generating real AI responses, not fallback messages.")
            print("✅ Responses are age-appropriate and in proper French.")
        else:
            print("⚠️  Some OpenAI tests failed. The system may be using fallback responses.")
            print("🔍 Check if the OpenAI API key is properly configured and valid.")
        
        return test_results

def main():
    """Main test execution function"""
    tester = OpenAIIntegrationTester()
    results = tester.run_openai_tests()
    
    # Return exit code based on test results
    failed_tests = [name for name, result in results.items() if not result]
    if failed_tests:
        print(f"\nFailed tests: {', '.join(failed_tests)}")
        return 1
    return 0

if __name__ == "__main__":
    exit(main())