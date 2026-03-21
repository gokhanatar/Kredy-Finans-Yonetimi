
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';
import { Property, Vehicle, Business } from '@/types/assetTypes';
import { calculate2026PropertyValue } from '@/lib/assetTaxUtils';
 
const STORAGE_KEY_PROPERTIES = 'kredi-pusula-properties';
const STORAGE_KEY_VEHICLES = 'kredi-pusula-vehicles';
const STORAGE_KEY_BUSINESSES = 'kredi-pusula-businesses';
 
// Shared asset operations logic
function useAssetOperations(
  properties: Property[],
  setProperties: (value: Property[] | ((prev: Property[]) => Property[])) => void,
  vehicles: Vehicle[],
  setVehicles: (value: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void,
  businesses: Business[],
  setBusinesses: (value: Business[] | ((prev: Business[]) => Business[])) => void
) {
  // ============= PROPERTY OPERATIONS =============
 
  const addProperty = useCallback((propertyData: Omit<Property, 'id' | 'currentValue' | 'createdAt'>) => {
    const newProperty: Property = {
      ...propertyData,
      id: crypto.randomUUID(),
      currentValue: calculate2026PropertyValue(propertyData.valuePreviousYear),
      createdAt: new Date(),
    };
 
    setProperties(prev => [...prev, newProperty]);
    return newProperty;
  }, [setProperties]);
 
  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => {
      if (p.id !== id) return p;
 
      const updated = { ...p, ...updates };
 
      if (updates.valuePreviousYear !== undefined) {
        updated.currentValue = calculate2026PropertyValue(updates.valuePreviousYear);
      }
 
      return updated;
    }));
  }, [setProperties]);
 
  const deleteProperty = useCallback((id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  }, [setProperties]);
 
  // ============= VEHICLE OPERATIONS =============
 
  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
 
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle;
  }, [setVehicles]);
 
  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, [setVehicles]);
 
  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, [setVehicles]);
 
  // ============= BUSINESS OPERATIONS =============
 
  const addBusiness = useCallback((businessData: Omit<Business, 'id' | 'createdAt'>) => {
    const newBusiness: Business = {
      ...businessData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
 
    setBusinesses(prev => [...prev, newBusiness]);
    return newBusiness;
  }, [setBusinesses]);
 
  const updateBusiness = useCallback((id: string, updates: Partial<Business>) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [setBusinesses]);
 
  const deleteBusiness = useCallback((id: string) => {
    setBusinesses(prev => prev.filter(b => b.id !== id));
  }, [setBusinesses]);
 
  return {
    properties, vehicles, businesses,
    addProperty, updateProperty, deleteProperty,
    addVehicle, updateVehicle, deleteVehicle,
    addBusiness, updateBusiness, deleteBusiness,
  };
}
 
export function useAssets() {
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEY_PROPERTIES, []);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>(STORAGE_KEY_VEHICLES, []);
  const [businesses, setBusinesses] = useLocalStorage<Business[]>(STORAGE_KEY_BUSINESSES, []);
  return useAssetOperations(properties, setProperties, vehicles, setVehicles, businesses, setBusinesses);
}
 
export function useFamilyAssets() {
  const [properties, setProperties] = useFamilySyncedStorage<Property[]>('kredi-pusula-family-properties', []);
  const [vehicles, setVehicles] = useFamilySyncedStorage<Vehicle[]>('kredi-pusula-family-vehicles', []);
  const [businesses, setBusinesses] = useFamilySyncedStorage<Business[]>('kredi-pusula-family-businesses', []);
  return useAssetOperations(properties, setProperties, vehicles, setVehicles, businesses, setBusinesses);
}
 