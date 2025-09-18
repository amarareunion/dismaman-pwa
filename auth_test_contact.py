#!/usr/bin/env python3
"""
Test d'authentification pour contact@dismaman.fr
Vérifie l'existence de l'utilisateur et teste l'authentification
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/dismaman-complete/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class ContactAuthTester:
    def __init__(self):
        self.target_email = "contact@dismaman.fr"
        self.target_password = "Test123!"
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"[{timestamp}] {status_symbol} {test_name}: {status}")
        if details:
            print(f"    Details: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None, auth_required: bool = True) -> requests.Response:
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
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def test_backend_health(self) -> bool:
        """Test if backend is running"""
        test_name = "Backend Health Check"
        
        try:
            response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(test_name, "PASS", f"Backend is healthy: {data.get('status')}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Backend health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Cannot connect to backend: {str(e)}")
            return False

    def test_user_login_contact(self) -> bool:
        """Test login with contact@dismaman.fr"""
        test_name = "Login contact@dismaman.fr"
        
        try:
            login_data = {
                "email": self.target_email,
                "password": self.target_password
            }
            
            response = self.make_request("POST", "/auth/token", login_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                self.log_test(test_name, "PASS", f"Login successful for {self.target_email}, User ID: {self.user_id}")
                return True
            elif response.status_code == 401:
                self.log_test(test_name, "FAIL", f"Authentication failed - user may not exist or wrong password")
                return False
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_user_registration_contact(self) -> bool:
        """Test registration of contact@dismaman.fr if login fails"""
        test_name = "Register contact@dismaman.fr"
        
        try:
            user_data = {
                "email": self.target_email,
                "password": self.target_password,
                "first_name": "Contact",
                "last_name": "DisMaman"
            }
            
            response = self.make_request("POST", "/auth/register", user_data, auth_required=False)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.user_id = data["user"]["id"]
                self.log_test(test_name, "PASS", f"User {self.target_email} registered successfully with ID: {self.user_id}")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_test(test_name, "INFO", f"User {self.target_email} already exists - this is expected")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_get_user_info(self) -> bool:
        """Test get current user info"""
        test_name = "Get User Info"
        
        try:
            if not self.access_token:
                self.log_test(test_name, "SKIP", "No access token available")
                return True
                
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(test_name, "PASS", f"User info: {data['email']}, Name: {data['first_name']} {data['last_name']}")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def test_list_all_users(self) -> bool:
        """Test listing all users (admin endpoint)"""
        test_name = "List All Users (Admin)"
        
        try:
            if not self.access_token:
                self.log_test(test_name, "SKIP", "No access token available")
                return True
                
            response = self.make_request("GET", "/admin/users")
            
            if response.status_code == 200:
                data = response.json()
                total_users = data.get("total_users", 0)
                users = data.get("users", [])
                
                self.log_test(test_name, "PASS", f"Found {total_users} users in database")
                
                print("📋 EXISTING USERS IN DATABASE:")
                print("=" * 60)
                for user in users[:10]:  # Show first 10 users
                    print(f"Email: {user['email']}")
                    print(f"  Name: {user.get('first_name', '')} {user.get('last_name', '')}")
                    print(f"  Created: {user.get('created_at', 'N/A')}")
                    print(f"  Children: {user.get('children_count', 0)}")
                    print(f"  Questions: {user.get('questions_count', 0)}")
                    print(f"  Premium: {user.get('is_premium', False)}")
                    print()
                
                if total_users > 10:
                    print(f"... and {total_users - 10} more users")
                print("=" * 60)
                
                return True
            elif response.status_code == 403:
                self.log_test(test_name, "INFO", f"Admin access required - user {self.target_email} is not admin")
                return True
            else:
                self.log_test(test_name, "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(test_name, "FAIL", f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all authentication tests"""
        print("\n" + "=" * 80)
        print("🔐 TEST D'AUTHENTIFICATION POUR contact@dismaman.fr")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Target User: {self.target_email}")
        print(f"Password: {self.target_password}")
        print()
        
        # Test 1: Backend Health
        if not self.test_backend_health():
            print("❌ Backend is not accessible - stopping tests")
            return False
        
        # Test 2: Try to login first
        login_success = self.test_user_login_contact()
        
        # Test 3: If login fails, try to register
        if not login_success:
            print("🔄 Login failed, attempting to register user...")
            register_success = self.test_user_registration_contact()
            
            if register_success:
                # Try login again after registration
                print("🔄 Registration successful, trying login again...")
                login_success = self.test_user_login_contact()
        
        # Test 4: Get user info if authenticated
        if login_success:
            self.test_get_user_info()
        
        # Test 5: Try to list all users (admin function)
        self.test_list_all_users()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 80)
        
        if login_success:
            print("✅ L'utilisateur contact@dismaman.fr existe et l'authentification fonctionne")
            print(f"✅ Token d'accès obtenu: {self.access_token[:20]}...")
            print(f"✅ ID utilisateur: {self.user_id}")
        else:
            print("❌ Problème avec l'authentification de contact@dismaman.fr")
            print("❌ Vérifiez les logs ci-dessus pour plus de détails")
        
        print("=" * 80)
        
        return login_success

if __name__ == "__main__":
    tester = ContactAuthTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Tous les tests d'authentification ont réussi!")
    else:
        print("\n⚠️ Certains tests ont échoué - voir les détails ci-dessus")