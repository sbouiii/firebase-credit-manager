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
  DocumentData 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Customer, Credit, Payment } from "@shared/schema";
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

export function useCreateCustomer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: Omit<Customer, "id" | "createdAt">) => {
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "customers"), {
        ...customerData,
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
      await addDoc(collection(db, "payments"), {
        ...paymentData,
        userId: user.uid,
        createdAt: Date.now(),
      });

      // Update credit
      await updateDoc(doc(db, "credits", creditUpdate.id), creditUpdate.data as DocumentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}
