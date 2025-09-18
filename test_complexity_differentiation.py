#!/usr/bin/env python3
"""
Specific test for complexity level differentiation as requested in the review
"""

import sys
import os
sys.path.append('/app')

from backend_test import DisMamanAPITester

def main():
    print("🎯 TESTING COMPLEXITY LEVEL DIFFERENTIATION")
    print("="*60)
    
    tester = DisMamanAPITester()
    
    # Run only the complexity differentiation test
    result = tester.test_complexity_level_differentiation()
    
    if result:
        print("\n✅ COMPLEXITY DIFFERENTIATION TEST PASSED")
        return 0
    else:
        print("\n❌ COMPLEXITY DIFFERENTIATION TEST FAILED")
        return 1

if __name__ == "__main__":
    exit(main())