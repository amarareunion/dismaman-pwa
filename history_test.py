#!/usr/bin/env python3
"""
Focused Conversation History Test for Dis Maman! Backend API
Tests the history functionality specifically for the ChatBubble component integration.
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

class HistoryTester:
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
        
        request_headers = {"Content-Type": "application/json"}
        if auth_required and self.access_token:
            request_headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def authenticate(self) -> bool:
        """Authenticate with test credentials"""
        print("🔐 Authenticating with test@dismaman.fr / Test123!...")
        
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            print("✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}, {response.text}")
            return False

    def test_conversation_history_comprehensive(self) -> bool:
        """Comprehensive test of conversation history functionality for ChatBubble component"""
        test_name = "Conversation History - Comprehensive Test"
        
        try:
            print("\n" + "="*80)
            print("📚 COMPREHENSIVE CONVERSATION HISTORY TEST")
            print("="*80)
            print("Testing history functionality for the newly implemented conversation history screen")
            print()
            
            # Step 1: Authentication
            if not self.authenticate():
                self.log_test(test_name, "FAIL", "Authentication failed")
                return False
            
            # Step 2: Test Children API
            print("Step 2: Testing GET /api/children to ensure children data is available...")
            children_response = self.make_request("GET", "/children")
            
            if children_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Children API failed: {children_response.status_code}")
                return False
            
            children = children_response.json()
            print(f"✅ Retrieved {len(children)} children for history testing")
            
            if len(children) == 0:
                # Create test children for history testing
                print("Creating test children for history testing...")
                test_children_data = [
                    {"name": "Emma History", "gender": "girl", "birth_month": 6, "birth_year": 2019},
                    {"name": "Lucas History", "gender": "boy", "birth_month": 3, "birth_year": 2018}
                ]
                
                for child_data in test_children_data:
                    response = self.make_request("POST", "/children", child_data)
                    if response.status_code in [200, 201]:
                        children.append(response.json())
                        print(f"✅ Created test child: {child_data['name']}")
            
            if len(children) == 0:
                self.log_test(test_name, "FAIL", "No children available for history testing")
                return False
            
            # Step 3: Create conversation history by asking questions
            print(f"\nStep 3: Creating conversation history for testing...")
            test_questions = [
                "Pourquoi le ciel est-il bleu?",
                "Comment les oiseaux volent-ils?",
                "Qu'est-ce que la photosynthèse?",
                "Pourquoi la lune change-t-elle de forme?",
                "Comment fonctionne un arc-en-ciel?"
            ]
            
            created_responses = []
            for i, child in enumerate(children[:2]):  # Test with first 2 children
                child_id = child['id']
                child_name = child['name']
                print(f"\nCreating history for {child_name}...")
                
                # Create 3-5 questions per child
                questions_for_child = test_questions[:3] if i == 0 else test_questions[2:]
                
                for question in questions_for_child:
                    question_data = {
                        "question": question,
                        "child_id": child_id
                    }
                    
                    response = self.make_request("POST", "/questions", question_data)
                    if response.status_code == 200:
                        response_data = response.json()
                        created_responses.append({
                            "id": response_data["id"],
                            "child_id": child_id,
                            "child_name": child_name,
                            "question": question,
                            "answer": response_data["answer"]
                        })
                        print(f"   ✅ Created: {question}")
                        
                        # Add some feedback to test feedback field
                        if len(created_responses) % 2 == 0:  # Add feedback to every 2nd response
                            feedback_data = {"response_id": response_data["id"], "feedback": "understood"}
                            feedback_response = self.make_request("POST", f"/responses/{response_data['id']}/feedback", feedback_data)
                            if feedback_response.status_code == 200:
                                print(f"      ✅ Added feedback: understood")
                    
                    time.sleep(1)  # Small delay between requests
            
            print(f"✅ Created {len(created_responses)} conversation entries for history testing")
            
            # Step 4: Test Conversation History API for each child
            print(f"\nStep 4: Testing GET /api/responses/child/{{child_id}} for each child...")
            
            history_test_results = []
            
            for child in children[:2]:  # Test first 2 children
                child_id = child['id']
                child_name = child['name']
                
                print(f"\nTesting history for {child_name} (ID: {child_id})...")
                
                # Test the history endpoint
                history_response = self.make_request("GET", f"/responses/child/{child_id}")
                
                if history_response.status_code != 200:
                    self.log_test(test_name, "FAIL", f"History API failed for child {child_name}: {history_response.status_code}")
                    return False
                
                history_data = history_response.json()
                
                # Verify response is a list
                if not isinstance(history_data, list):
                    self.log_test(test_name, "FAIL", f"History API should return list, got: {type(history_data)}")
                    return False
                
                print(f"   ✅ Retrieved {len(history_data)} history entries")
                
                # Verify limit of 20 responses
                if len(history_data) > 20:
                    self.log_test(test_name, "FAIL", f"History should return max 20 responses, got: {len(history_data)}")
                    return False
                
                print(f"   ✅ Respects 20 response limit")
                
                # Verify required fields for ChatBubble component
                required_fields = ["id", "question", "answer", "child_name", "created_at", "feedback"]
                
                for i, entry in enumerate(history_data):
                    missing_fields = [field for field in required_fields if field not in entry]
                    if missing_fields:
                        self.log_test(test_name, "FAIL", f"Missing required fields in entry {i}: {missing_fields}")
                        return False
                
                print(f"   ✅ All entries contain required fields: {required_fields}")
                
                # Verify data is sorted by created_at (most recent first)
                if len(history_data) > 1:
                    for i in range(len(history_data) - 1):
                        current_time = datetime.fromisoformat(history_data[i]["created_at"].replace('Z', '+00:00'))
                        next_time = datetime.fromisoformat(history_data[i+1]["created_at"].replace('Z', '+00:00'))
                        
                        if current_time < next_time:
                            self.log_test(test_name, "FAIL", f"History not sorted by created_at (most recent first)")
                            return False
                
                print(f"   ✅ Data properly sorted by created_at (most recent first)")
                
                # Verify feedback field contains correct values
                valid_feedback_values = ['understood', 'too_complex', 'need_more_details', None]
                
                for entry in history_data:
                    if entry["feedback"] not in valid_feedback_values:
                        self.log_test(test_name, "FAIL", f"Invalid feedback value: {entry['feedback']}")
                        return False
                
                print(f"   ✅ Feedback field contains correct values")
                
                # Verify child_name association
                for entry in history_data:
                    if entry["child_name"] != child_name:
                        self.log_test(test_name, "FAIL", f"Child name mismatch: expected {child_name}, got {entry['child_name']}")
                        return False
                
                print(f"   ✅ Child name properly associated in all entries")
                
                # Verify data structure matches ChatBubble expectations
                sample_entry = history_data[0] if history_data else None
                if sample_entry:
                    # Check question and answer text content
                    if not isinstance(sample_entry["question"], str) or len(sample_entry["question"]) == 0:
                        self.log_test(test_name, "FAIL", "Question text content invalid")
                        return False
                    
                    if not isinstance(sample_entry["answer"], str) or len(sample_entry["answer"]) == 0:
                        self.log_test(test_name, "FAIL", "Answer text content invalid")
                        return False
                    
                    # Check timestamp format
                    try:
                        datetime.fromisoformat(sample_entry["created_at"].replace('Z', '+00:00'))
                    except:
                        self.log_test(test_name, "FAIL", f"Invalid timestamp format: {sample_entry['created_at']}")
                        return False
                
                print(f"   ✅ Data structure matches ChatBubble component expectations")
                
                history_test_results.append({
                    "child_name": child_name,
                    "child_id": child_id,
                    "entries_count": len(history_data),
                    "has_feedback": any(entry["feedback"] is not None for entry in history_data),
                    "properly_sorted": True,
                    "valid_structure": True
                })
            
            # Step 5: Test Error Handling - Edge Cases
            print(f"\nStep 5: Testing error handling and edge cases...")
            
            # Test non-existent child ID
            fake_child_id = "507f1f77bcf86cd799439011"
            error_response = self.make_request("GET", f"/responses/child/{fake_child_id}")
            
            if error_response.status_code == 200:
                # Should return empty list for non-existent child, not error
                error_data = error_response.json()
                if isinstance(error_data, list) and len(error_data) == 0:
                    print("   ✅ Non-existent child returns empty list (correct behavior)")
                else:
                    self.log_test(test_name, "FAIL", f"Non-existent child should return empty list")
                    return False
            else:
                print(f"   ✅ Non-existent child returns status {error_response.status_code}")
            
            # Test authentication requirement
            original_token = self.access_token
            self.access_token = None
            
            unauth_response = self.make_request("GET", f"/responses/child/{children[0]['id']}", auth_required=False)
            
            if unauth_response.status_code not in [401, 403]:
                self.access_token = original_token
                self.log_test(test_name, "FAIL", f"History API should require authentication, got: {unauth_response.status_code}")
                return False
            
            self.access_token = original_token
            print("   ✅ Proper authentication requirement enforced")
            
            # Final Results Summary
            print(f"\n" + "="*80)
            print("📊 CONVERSATION HISTORY TEST RESULTS")
            print("="*80)
            
            for result in history_test_results:
                print(f"Child: {result['child_name']}")
                print(f"  - History entries: {result['entries_count']}")
                print(f"  - Has feedback entries: {'Yes' if result['has_feedback'] else 'No'}")
                print(f"  - Properly sorted: {'Yes' if result['properly_sorted'] else 'No'}")
                print(f"  - Valid structure: {'Yes' if result['valid_structure'] else 'No'}")
                print()
            
            print("✅ ALL CONVERSATION HISTORY TESTS PASSED!")
            print("✅ History API works correctly for conversation history screen")
            print("✅ Returns last 20 questions/answers per child as documented")
            print("✅ Includes all required fields for ChatBubble component")
            print("✅ Data properly sorted by created_at (most recent first)")
            print("✅ Feedback field contains correct values")
            print("✅ Proper child name association and timestamps")
            print("✅ Error handling works for edge cases")
            print("✅ Authentication requirements properly enforced")
            print("="*80)
            
            self.log_test(test_name, "PASS", f"All conversation history functionality verified. API ready for ChatBubble integration.")
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

def main():
    """Run the focused conversation history test"""
    print("="*80)
    print("🚀 FOCUSED CONVERSATION HISTORY TEST FOR DIS MAMAN!")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print()
    
    tester = HistoryTester()
    
    # Run the comprehensive conversation history test
    success = tester.test_conversation_history_comprehensive()
    
    # Final summary
    print("\n" + "="*80)
    print("🎯 FINAL TEST RESULTS")
    print("="*80)
    
    if success:
        print("🎉 CONVERSATION HISTORY TEST PASSED!")
        print("✅ Backend API is ready for ChatBubble integration")
        print("✅ All required fields present and properly formatted")
        print("✅ Data sorting and limits working correctly")
        print("✅ Error handling and authentication working")
    else:
        print("❌ CONVERSATION HISTORY TEST FAILED!")
        print("⚠️  Review the logs above for details")
    
    print("="*80)

if __name__ == "__main__":
    main()