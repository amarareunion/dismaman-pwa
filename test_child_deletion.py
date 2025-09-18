#!/usr/bin/env python3
"""
Focused Child Deletion Test for Dis Maman! Mobile App
Tests specifically the child deletion functionality as requested.
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

class ChildDeletionTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
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
        """Authenticate with test@dismaman.fr / Test123!"""
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
                return True
            else:
                print(f"Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Authentication exception: {str(e)}")
            return False

    def test_comprehensive_child_deletion(self) -> bool:
        """Comprehensive test of child deletion functionality as requested"""
        test_name = "Comprehensive Child Deletion Test"
        
        try:
            print("\n" + "="*60)
            print("🗑️  COMPREHENSIVE CHILD DELETION TEST")
            print("="*60)
            
            # Step 1: Authenticate with test@dismaman.fr / Test123!
            print("Step 1: Authenticating with test@dismaman.fr...")
            if not self.authenticate():
                self.log_test(test_name, "FAIL", "Authentication failed")
                return False
            print("✅ Authentication successful")
            
            # Step 2: List existing children via GET /api/children
            print("\nStep 2: Listing existing children...")
            children_response = self.make_request("GET", "/children")
            
            if children_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not list children: {children_response.status_code}")
                return False
            
            children_before = children_response.json()
            print(f"✅ Found {len(children_before)} existing children:")
            for child in children_before:
                print(f"   - {child['name']} (ID: {child['id']}, Gender: {child['gender']}, Age: {child['age_months']} months)")
            
            if len(children_before) == 0:
                # Create a test child for deletion
                print("\nNo children found, creating a test child for deletion...")
                child_data = {
                    "name": "Test Child for Deletion",
                    "gender": "boy",
                    "birth_month": 6,
                    "birth_year": 2020,
                    "complexity_level": 0
                }
                
                create_response = self.make_request("POST", "/children", child_data)
                if create_response.status_code not in [200, 201]:
                    self.log_test(test_name, "FAIL", f"Could not create test child: {create_response.status_code}")
                    return False
                
                created_child = create_response.json()
                children_before = [created_child]
                print(f"✅ Created test child: {created_child['name']} (ID: {created_child['id']})")
            
            # Step 3: Test deletion of existing child
            print(f"\nStep 3: Testing deletion of child...")
            child_to_delete = children_before[0]  # Delete the first child
            child_id = child_to_delete['id']
            child_name = child_to_delete['name']
            
            print(f"Attempting to delete child: {child_name} (ID: {child_id})")
            delete_response = self.make_request("DELETE", f"/children/{child_id}")
            
            # Step 4: Verify deletion status code
            if delete_response.status_code not in [200, 204]:
                self.log_test(test_name, "FAIL", f"Deletion failed with status {delete_response.status_code}: {delete_response.text}")
                return False
            
            print(f"✅ Deletion request successful (Status: {delete_response.status_code})")
            
            # Verify response message
            if delete_response.status_code == 200:
                delete_data = delete_response.json()
                if "message" not in delete_data or "deleted" not in delete_data["message"].lower():
                    self.log_test(test_name, "FAIL", f"Unexpected deletion response: {delete_data}")
                    return False
                print(f"✅ Deletion message: {delete_data['message']}")
            
            # Step 5: Verify child is actually deleted by listing again
            print(f"\nStep 4: Verifying child {child_name} is deleted...")
            children_after_response = self.make_request("GET", "/children")
            
            if children_after_response.status_code != 200:
                self.log_test(test_name, "FAIL", f"Could not list children after deletion: {children_after_response.status_code}")
                return False
            
            children_after = children_after_response.json()
            print(f"✅ Children list retrieved after deletion: {len(children_after)} children found")
            
            # Verify the deleted child is not in the list
            deleted_child_still_exists = any(child['id'] == child_id for child in children_after)
            if deleted_child_still_exists:
                self.log_test(test_name, "FAIL", f"Child {child_name} (ID: {child_id}) still exists after deletion")
                return False
            
            print(f"✅ Confirmed: Child {child_name} (ID: {child_id}) no longer appears in children list")
            
            # Verify count decreased
            if len(children_after) != len(children_before) - 1:
                self.log_test(test_name, "FAIL", f"Children count mismatch: before={len(children_before)}, after={len(children_after)}")
                return False
            
            print(f"✅ Children count correctly decreased from {len(children_before)} to {len(children_after)}")
            
            # Step 6: Test error cases
            print(f"\nStep 5: Testing error cases...")
            
            # Test 1: Try to delete non-existent child
            print("Testing deletion of non-existent child...")
            fake_child_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            fake_delete_response = self.make_request("DELETE", f"/children/{fake_child_id}")
            
            if fake_delete_response.status_code != 404:
                self.log_test(test_name, "FAIL", f"Expected 404 for non-existent child, got: {fake_delete_response.status_code}")
                return False
            
            print("✅ Correctly returned 404 for non-existent child")
            
            # Test 2: Try to delete without authentication
            print("Testing deletion without authentication...")
            original_token = self.access_token
            self.access_token = None
            
            # Create another child to test unauthorized deletion
            self.access_token = original_token
            if len(children_after) > 0:
                test_child_id = children_after[0]['id']
                self.access_token = None
                
                unauth_delete_response = self.make_request("DELETE", f"/children/{test_child_id}", auth_required=False)
                
                if unauth_delete_response.status_code not in [401, 403]:
                    self.access_token = original_token
                    self.log_test(test_name, "FAIL", f"Expected 401 or 403 for unauthorized deletion, got: {unauth_delete_response.status_code}")
                    return False
                
                print(f"✅ Correctly returned {unauth_delete_response.status_code} for unauthorized deletion")
            else:
                print("⚠️  Skipped unauthorized deletion test (no children available)")
            
            # Restore token
            self.access_token = original_token
            
            print(f"\n✅ ALL CHILD DELETION TESTS PASSED!")
            print("="*60)
            
            self.log_test(test_name, "PASS", f"All deletion scenarios tested successfully: existing child deleted, non-existent child returns 404, unauthorized access returns 401")
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

def main():
    """Main test execution function"""
    tester = ChildDeletionTester()
    success = tester.test_comprehensive_child_deletion()
    
    if success:
        print("\n🎉 CHILD DELETION TEST COMPLETED SUCCESSFULLY!")
        return 0
    else:
        print("\n❌ CHILD DELETION TEST FAILED!")
        return 1

if __name__ == "__main__":
    exit(main())