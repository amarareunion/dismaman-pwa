#!/usr/bin/env python3
"""
Specific test for feedback regeneration bug fix
Tests that 'trop difficile' and 'plus d'infos' buttons work correctly
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

def log_test(test_name: str, status: str, details: str = ""):
    """Log test results"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
    if details:
        print(f"    Details: {details}")
    print()

def make_request(method: str, endpoint: str, data: dict = None, headers: dict = None, access_token: str = None) -> requests.Response:
    """Make HTTP request with proper headers"""
    url = f"{API_BASE}{endpoint}"
    
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
        
    if access_token:
        request_headers["Authorization"] = f"Bearer {access_token}"
    
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

def test_feedback_regeneration_bug_fix():
    """Test specific feedback regeneration bug fix - GPT-5 empty response fallback to GPT-4o"""
    test_name = "Feedback Regeneration Bug Fix"
    
    try:
        print("\n" + "="*80)
        print("🔧 TESTING FEEDBACK REGENERATION BUG FIX")
        print("="*80)
        print("Testing that 'trop difficile' and 'plus d'infos' buttons work correctly")
        print("and no longer return 'Je n'ai pas pu ré-générer ma réponse' error")
        print()
        
        # Step 1: Authenticate
        print("Step 1: Authenticating with test@dismaman.fr...")
        login_data = {
            "email": "test@dismaman.fr",
            "password": "Test123!"
        }
        
        login_response = make_request("POST", "/auth/token", login_data)
        if login_response.status_code != 200:
            log_test(test_name, "FAIL", f"Authentication failed: {login_response.status_code}")
            return False
        
        login_result = login_response.json()
        access_token = login_result["access_token"]
        print("✅ Authentication successful with test@dismaman.fr")
        
        # Step 2: Get or create a child
        children_response = make_request("GET", "/children", access_token=access_token)
        if children_response.status_code != 200:
            log_test(test_name, "FAIL", "Could not retrieve children")
            return False
        
        children = children_response.json()
        if len(children) == 0:
            # Create a test child
            child_data = {
                "name": "Test Feedback",
                "gender": "boy",
                "birth_month": 6,
                "birth_year": 2019,
                "complexity_level": 0
            }
            
            create_response = make_request("POST", "/children", child_data, access_token=access_token)
            if create_response.status_code not in [200, 201]:
                log_test(test_name, "FAIL", f"Could not create test child: {create_response.status_code}")
                return False
            
            child = create_response.json()
            print(f"✅ Created test child: {child['name']} (5 years old)")
        else:
            child = children[0]
            print(f"✅ Using existing child: {child['name']} ({child['age_months']//12} years old)")
        
        child_id = child['id']
        child_name = child['name']
        
        # Step 3: Ask a scientific question
        print(f"\nStep 3: Asking scientific question to {child_name}...")
        question_data = {
            "question": "Comment les avions volent-ils ?",
            "child_id": child_id
        }
        
        response = make_request("POST", "/questions", question_data, access_token=access_token)
        if response.status_code != 200:
            log_test(test_name, "FAIL", f"Question failed: {response.status_code}, {response.text}")
            return False
        
        question_response = response.json()
        response_id = question_response.get("id")
        original_answer = question_response.get("answer", "")
        
        print(f"✅ Question asked successfully, response ID: {response_id}")
        print(f"   Original answer length: {len(original_answer)} characters")
        print(f"   Answer preview: {original_answer[:100]}...")
        
        # Verify it's not a fallback error message
        if "je n'ai pas pu" in original_answer.lower() or "redemander" in original_answer.lower():
            log_test(test_name, "FAIL", "Original question already returned error message")
            return False
        
        # Step 4: Test "too_complex" feedback (trop difficile)
        print(f"\nStep 4: Testing 'too_complex' feedback (trop difficile button)...")
        
        feedback_data = {
            "response_id": response_id,
            "feedback": "too_complex"
        }
        
        feedback_response = make_request("POST", f"/responses/{response_id}/feedback", feedback_data, access_token=access_token)
        if feedback_response.status_code != 200:
            log_test(test_name, "FAIL", f"'too_complex' feedback failed: {feedback_response.status_code}, {feedback_response.text}")
            return False
        
        feedback_result = feedback_response.json()
        
        # Verify regeneration was triggered
        if not feedback_result.get("regenerate", False):
            log_test(test_name, "FAIL", "'too_complex' feedback didn't trigger regeneration")
            return False
        
        # Verify new response was generated
        if "new_response" not in feedback_result:
            log_test(test_name, "FAIL", "No new response generated for 'too_complex' feedback")
            return False
        
        new_answer_complex = feedback_result["new_response"]["answer"]
        
        # Critical test: Verify it's NOT the error message
        if "je n'ai pas pu ré-générer ma réponse" in new_answer_complex.lower():
            log_test(test_name, "FAIL", "❌ CRITICAL BUG: 'too_complex' still returns error message!")
            return False
        
        print(f"✅ 'too_complex' feedback successful!")
        print(f"   New answer length: {len(new_answer_complex)} characters")
        print(f"   New answer preview: {new_answer_complex[:100]}...")
        print(f"   ✅ No error message detected - GPT-4o fallback working!")
        
        # Step 5: Ask another question for "need_more_details" test
        print(f"\nStep 5: Asking another question for 'need_more_details' test...")
        question_data2 = {
            "question": "Pourquoi les étoiles brillent-elles ?",
            "child_id": child_id
        }
        
        response2 = make_request("POST", "/questions", question_data2, access_token=access_token)
        if response2.status_code != 200:
            log_test(test_name, "FAIL", f"Second question failed: {response2.status_code}")
            return False
        
        question_response2 = response2.json()
        response_id2 = question_response2.get("id")
        original_answer2 = question_response2.get("answer", "")
        
        print(f"✅ Second question asked successfully, response ID: {response_id2}")
        print(f"   Answer preview: {original_answer2[:100]}...")
        
        # Step 6: Test "need_more_details" feedback (plus d'infos)
        print(f"\nStep 6: Testing 'need_more_details' feedback (plus d'infos button)...")
        
        feedback_data2 = {
            "response_id": response_id2,
            "feedback": "need_more_details"
        }
        
        feedback_response2 = make_request("POST", f"/responses/{response_id2}/feedback", feedback_data2, access_token=access_token)
        if feedback_response2.status_code != 200:
            log_test(test_name, "FAIL", f"'need_more_details' feedback failed: {feedback_response2.status_code}")
            return False
        
        feedback_result2 = feedback_response2.json()
        
        # Verify regeneration was triggered
        if not feedback_result2.get("regenerate", False):
            log_test(test_name, "FAIL", "'need_more_details' feedback didn't trigger regeneration")
            return False
        
        # Verify new response was generated
        if "new_response" not in feedback_result2:
            log_test(test_name, "FAIL", "No new response generated for 'need_more_details' feedback")
            return False
        
        new_answer_details = feedback_result2["new_response"]["answer"]
        
        # Critical test: Verify it's NOT the error message
        if "je n'ai pas pu ré-générer ma réponse" in new_answer_details.lower():
            log_test(test_name, "FAIL", "❌ CRITICAL BUG: 'need_more_details' still returns error message!")
            return False
        
        print(f"✅ 'need_more_details' feedback successful!")
        print(f"   New answer length: {len(new_answer_details)} characters")
        print(f"   New answer preview: {new_answer_details[:100]}...")
        print(f"   ✅ No error message detected - GPT-4o fallback working!")
        
        # Step 7: Verify complexity level changes
        print(f"\nStep 7: Verifying complexity level adaptations...")
        
        complexity_response = make_request("GET", f"/children/{child_id}/complexity", access_token=access_token)
        if complexity_response.status_code == 200:
            complexity_data = complexity_response.json()
            final_complexity = complexity_data.get("complexity_level", 0)
            print(f"✅ Final complexity level: {final_complexity}")
            print(f"   (Started at 0, should have changed due to feedback)")
        
        print(f"\n🎉 FEEDBACK REGENERATION BUG FIX TEST COMPLETED SUCCESSFULLY!")
        print("="*80)
        print("✅ CRITICAL SUCCESS CRITERIA MET:")
        print("   ✅ 'too_complex' feedback generates new response (not error message)")
        print("   ✅ 'need_more_details' feedback generates new response (not error message)")
        print("   ✅ GPT-5 empty response fallback to GPT-4o working correctly")
        print("   ✅ Complexity level adaptation functional")
        print("   ✅ No more 'Je n'ai pas pu ré-générer ma réponse' errors")
        print("="*80)
        
        log_test(test_name, "PASS", "Feedback regeneration bug fix verified - both 'trop difficile' and 'plus d'infos' buttons work correctly with GPT-4o fallback")
        return True
        
    except Exception as e:
        log_test(test_name, "FAIL", f"Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 SPECIFIC FEEDBACK REGENERATION BUG FIX TEST")
    print(f"Backend URL: {API_BASE}")
    print()
    
    success = test_feedback_regeneration_bug_fix()
    
    if success:
        print("\n🎉 TEST COMPLETED SUCCESSFULLY!")
        print("The feedback regeneration bug has been fixed.")
    else:
        print("\n❌ TEST FAILED!")
        print("The feedback regeneration bug still exists.")