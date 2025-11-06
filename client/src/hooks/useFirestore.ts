import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  DocumentData,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Customer, Credit, Payment, Store, CreditIncrease } from "@shared/schema";
import { generateAccessCode } from "@/lib/customerUtils";
import { useEffect } from "react";

// Real-time Firestore query with TanStack Query integration
function useFirestoreQuery<T>(
  collectionName: string,
  queryKey: string[]
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to Firestore and sync with TanStack Query cache
  useEffect(() => {
    if (!user) {
      queryClient.setQueryData(queryKey, []);
      return;
    }

    const q = query(
      collection(db, collectionName),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        // Update TanStack Query cache with Firestore data
        queryClient.setQueryData(queryKey, docs);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName, queryKey, queryClient]);

  // Use TanStack Query to manage the data
  return useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      // Initial data will come from onSnapshot, return empty array
      return queryClient.getQueryData<T[]>(queryKey) || [];
    },
    initialData: [],
    staleTime: Infinity, // Data is always fresh from Firestore realtime
  });
}

// Customers hooks
export function useCustomers() {
  return useFirestoreQuery<Customer>("customers", ["customers"]);
}

// Get customer by access code (for customer portal)
export function useCustomerByAccessCode(accessCode: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["customer", "accessCode", accessCode],
    queryFn: async () => {
      if (!accessCode) return null;
      
      const q = query(
        collection(db, "customers"),
        where("accessCode", "==", accessCode)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const customerDoc = querySnapshot.docs[0];
      return {
        id: customerDoc.id,
        ...customerDoc.data(),
      } as Customer;
    },
    enabled: !!accessCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateCustomer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: Omit<Customer, "id" | "createdAt">) => {
      if (!user) throw new Error("User not authenticated");
      
      // Generate access code if not provided
      const accessCode = customerData.accessCode || generateAccessCode();
      
      const docRef = await addDoc(collection(db, "customers"), {
        ...customerData,
        accessCode,
        userId: user.uid,
        createdAt: Date.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      await updateDoc(doc(db, "customers", id), data as DocumentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "customers", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// Credits hooks
export function useCredits() {
  return useFirestoreQuery<Credit>("credits", ["credits"]);
}

export function useCreateCredit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creditData: Omit<Credit, "id" | "createdAt" | "paidAmount" | "remainingAmount" | "status">) => {
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "credits"), {
        ...creditData,
        userId: user.uid,
        paidAmount: 0,
        remainingAmount: creditData.amount,
        status: "active",
        createdAt: Date.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Credit> }) => {
      await updateDoc(doc(db, "credits", id), data as DocumentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

// Payments hooks
export function usePayments() {
  return useFirestoreQuery<Payment>("payments", ["payments"]);
}

export function useCreatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentData, 
      creditUpdate 
    }: { 
      paymentData: Omit<Payment, "id" | "createdAt">; 
      creditUpdate: { id: string; data: Partial<Credit> };
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Create payment record
      const paymentRef = await addDoc(collection(db, "payments"), {
        ...paymentData,
        userId: user.uid,
        createdAt: Date.now(),
      });

      // Update credit
      await updateDoc(doc(db, "credits", creditUpdate.id), creditUpdate.data as DocumentData);

      return paymentRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

// Credit Increase hooks
export function useCreditIncreases() {
  return useFirestoreQuery<CreditIncrease>("creditIncreases", ["creditIncreases"]);
}

// Public hooks for customer portal (no authentication required)
export function usePublicCredits(customerId: string | null) {
  return useQuery<Credit[]>({
    queryKey: ["publicCredits", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const q = query(
        collection(db, "credits"),
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Credit));
    },
    enabled: !!customerId,
    initialData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePublicPayments(customerId: string | null) {
  return useQuery<Payment[]>({
    queryKey: ["publicPayments", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const q = query(
        collection(db, "payments"),
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Payment));
    },
    enabled: !!customerId,
    initialData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePublicCreditIncreases(customerId: string | null) {
  return useQuery<CreditIncrease[]>({
    queryKey: ["publicCreditIncreases", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const q = query(
        collection(db, "creditIncreases"),
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as CreditIncrease));
    },
    enabled: !!customerId,
    initialData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateCreditIncrease() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      creditIncreaseData, 
      creditUpdate 
    }: { 
      creditIncreaseData: Omit<CreditIncrease, "id" | "createdAt">; 
      creditUpdate: { id: string; data: Partial<Credit> };
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Create credit increase record
      await addDoc(collection(db, "creditIncreases"), {
        ...creditIncreaseData,
        userId: user.uid,
        createdAt: Date.now(),
      });

      // Update credit
      await updateDoc(doc(db, "credits", creditUpdate.id), creditUpdate.data as DocumentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditIncreases"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

// Store hooks
export function useStore() {
  const { user } = useAuth();

  return useQuery<Store | null>({
    queryKey: ["store", user?.uid],
    queryFn: async () => {
      if (!user) return null;

      const q = query(
        collection(db, "stores"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const storeDoc = querySnapshot.docs[0];
      return {
        id: storeDoc.id,
        ...storeDoc.data(),
      } as Store;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeData: Omit<Store, "id" | "createdAt" | "updatedAt">) => {
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "stores"), {
        ...storeData,
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Store> }) => {
      await updateDoc(doc(db, "stores", id), {
        ...data,
        updatedAt: Date.now(),
      } as DocumentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
}
