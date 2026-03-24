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
