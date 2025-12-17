import api from '@/lib/api';
import {
  AddressCategory,
  CreateCategoryPayload,
  Customer,
  CustomerCategory,
  CustomerFormValues,
} from '../types';

// ==================================================================
// CUSTOMER CATEGORY OPERATIONS
// ==================================================================

export const getCustomerCategories = async (): Promise<CustomerCategory[]> => {
  const { data } = await api.get('/customers/customer-categories');
  return data;
};

export const createCustomerCategory = async (
  payload: CreateCategoryPayload
): Promise<CustomerCategory> => {
  const { data } = await api.post('/customers/customer-categories', payload);
  return data;
};

export const updateCustomerCategory = async (
  id: string,
  payload: CreateCategoryPayload
): Promise<CustomerCategory> => {
  // Backend usa @Put para categorias
  const { data } = await api.put(`/customers/customer-categories/${id}`, payload);
  return data;
};

export const deleteCustomerCategory = async (id: string): Promise<void> => {
  await api.delete(`/customers/customer-categories/${id}`);
};

// Nota: O backend fornecido não tinha rota DELETE para CustomerCategory,
// então removi daqui para evitar erros 404.

// ==================================================================
// ADDRESS CATEGORY OPERATIONS
// ==================================================================

export const getAddressCategories = async (): Promise<AddressCategory[]> => {
  const { data } = await api.get('/customers/address-categories');
  return data;
};

export const createAddressCategory = async (
  payload: CreateCategoryPayload
): Promise<AddressCategory> => {
  const { data } = await api.post('/customers/address-categories', payload);
  return data;
};

export const updateAddressCategory = async (
  id: string,
  payload: CreateCategoryPayload
): Promise<AddressCategory> => {
  // Backend usa @Put para categorias
  const { data } = await api.put(`/customers/address-categories/${id}`, payload);
  return data;
};

export const deleteAddressCategory = async (id: string): Promise<void> => {
  await api.delete(`/customers/address-categories/${id}`);
};

// ==================================================================
// CUSTOMER CORE OPERATIONS (CRUD)
// ==================================================================

export const createCustomer = async (data: CustomerFormValues): Promise<Customer> => {
  const { data: response } = await api.post('/customers', data);
  return response;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await api.get('/customers');
  return data;
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const updateCustomer = async (id: string, data: CustomerFormValues): Promise<Customer> => {
  const { data: response } = await api.patch(`/customers/${id}`, data);
  return response;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};
