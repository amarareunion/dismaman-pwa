#!/usr/bin/env python3
"""
Run only the balanced security test for the Dis Maman! app
"""

from backend_test import DisMamanAPITester

def main():
    print("🎯 RUNNING BALANCED SECURITY TEST FOR DIS MAMAN!")
    print("=" * 80)
    
    tester = DisMamanAPITester()
    
    # Run only the balanced security test
    result = tester.test_balanced_security_education_system()
    
    print("\n" + "=" * 80)
    if result:
        print("🎉 BALANCED SECURITY TEST PASSED!")
        print("✅ System successfully balances education and protection")
    else:
        print("❌ BALANCED SECURITY TEST FAILED!")
        print("⚠️  System needs adjustments for balanced approach")
    print("=" * 80)
    
    return result

if __name__ == "__main__":
    main()