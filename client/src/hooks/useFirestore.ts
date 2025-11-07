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
      if (!accessCode) {
        console.log("[useCustomerByAccessCode] No accessCode provided");
        return null;
      }
      
      try {
        console.log("[useCustomerByAccessCode] Fetching customer with accessCode:", accessCode);
        const q = query(
          collection(db, "customers"),
          where("accessCode", "==", accessCode)
        );
        
        const querySnapshot = await getDocs(q);
        console.log("[useCustomerByAccessCode] Query snapshot size:", querySnapshot.size);
        
        if (querySnapshot.empty) {
          console.log("[useCustomerByAccessCode] ❌ No customer found with accessCode:", accessCode);
          return null;
        }
        
        const customerDoc = querySnapshot.docs[0];
        const customerData = {
          id: customerDoc.id,
          ...customerDoc.data(),
        } as Customer;
        
        console.log("[useCustomerByAccessCode] ✅ Customer found:", customerData);
        console.log("[useCustomerByAccessCode] Customer ID:", customerData.id);
        console.log("[useCustomerByAccessCode] Customer Name:", customerData.name);
        
        return customerData;
      } catch (error: any) {
        console.error("[useCustomerByAccessCode] ❌ Error fetching customer:", error);
        console.error("[useCustomerByAccessCode] Error code:", error.code);
        console.error("[useCustomerByAccessCode] Error message:", error.message);
        throw error;
      }
    },
    enabled: !!accessCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
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
      // First, delete all credits associated with this customer
      const creditsQuery = query(
        collection(db, "credits"),
        where("customerId", "==", id)
      );
      const creditsSnapshot = await getDocs(creditsQuery);
      
      // Delete all credits
      const deleteCreditPromises = creditsSnapshot.docs.map((creditDoc) =>
        deleteDoc(creditDoc.ref)
      );
      await Promise.all(deleteCreditPromises);

      // Then delete the customer
      await deleteDoc(doc(db, "customers", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
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
  console.log("[usePublicCredits] Hook called with customerId:", customerId);
  console.log("[usePublicCredits] Hook enabled:", !!customerId);
  
  const queryResult = useQuery<Credit[]>({
    queryKey: ["publicCredits", customerId],
    queryFn: async () => {
      console.log("[usePublicCredits] ========== queryFn CALLED ==========");
      console.log("[usePublicCredits] queryFn called with customerId:", customerId);
      
      if (!customerId) {
        console.log("[usePublicCredits] No customerId provided in queryFn");
        return [];
      }
      
      try {
        console.log("[usePublicCredits] ========== START FETCHING CREDITS ==========");
        console.log("[usePublicCredits] Fetching credits for customerId:", customerId);
        console.log("[usePublicCredits] CustomerId type:", typeof customerId);
        
        const q = query(
          collection(db, "credits"),
          where("customerId", "==", customerId)
        );
        
        console.log("[usePublicCredits] Query created, executing getDocs...");
        const querySnapshot = await getDocs(q);
        console.log("[usePublicCredits] Query snapshot received");
        console.log("[usePublicCredits] Query snapshot size:", querySnapshot.size);
        console.log("[usePublicCredits] Query snapshot empty:", querySnapshot.empty);
        
        if (querySnapshot.empty) {
          console.log("[usePublicCredits] ⚠️ Query returned empty results");
          console.log("[usePublicCredits] This could mean:");
          console.log("[usePublicCredits] 1. No credits exist for this customerId");
          console.log("[usePublicCredits] 2. Firestore rules are blocking the query");
          console.log("[usePublicCredits] 3. The customerId doesn't match any credits");
          
          // Try to get all credits to see if any exist (for debugging only)
          try {
            const allCreditsQuery = query(collection(db, "credits"));
            const allCreditsSnapshot = await getDocs(allCreditsQuery);
            console.log("[usePublicCredits] DEBUG: Total credits in database:", allCreditsSnapshot.size);
            if (allCreditsSnapshot.size > 0) {
              console.log("[usePublicCredits] DEBUG: Sample credit customerIds:", 
                allCreditsSnapshot.docs.slice(0, 3).map(doc => ({
                  id: doc.id,
                  customerId: doc.data().customerId,
                  customerName: doc.data().customerName,
                }))
              );
            }
          } catch (debugError) {
            console.log("[usePublicCredits] DEBUG: Could not fetch all credits (expected if rules block it):", debugError);
          }
          
          return [];
        }
        
        const credits = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          console.log(`[usePublicCredits] Credit ${index + 1} data:`, {
            id: doc.id,
            customerId: data.customerId,
            customerName: data.customerName,
            amount: data.amount,
            remainingAmount: data.remainingAmount,
          });
          return {
            id: doc.id,
            ...data,
          } as Credit;
        });
        
        console.log(`[usePublicCredits] ✅ Found ${credits.length} credits for customer ${customerId}`);
        console.log("[usePublicCredits] Credits details:", credits);
        console.log("[usePublicCredits] ========== END FETCHING CREDITS ==========");
        return credits;
      } catch (error: any) {
        console.error("[usePublicCredits] ❌ ========== ERROR FETCHING CREDITS ==========");
        console.error("[usePublicCredits] Error fetching credits:", error);
        console.error("[usePublicCredits] Error code:", error.code);
        console.error("[usePublicCredits] Error message:", error.message);
        console.error("[usePublicCredits] Error stack:", error.stack);
        if (error.code === "permission-denied") {
          console.error("[usePublicCredits] ⚠️ PERMISSION DENIED - Check Firestore security rules!");
          console.error("[usePublicCredits] The rules might be blocking public access to credits");
        }
        console.error("[usePublicCredits] ============================================");
        // Return empty array on error instead of throwing to prevent UI crash
        return [];
      }
    },
    enabled: !!customerId,
    // Remove initialData to force the query to run
    // initialData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  // Debug query state
  useEffect(() => {
    console.log("[usePublicCredits] Query state:", {
      isLoading: queryResult.isLoading,
      isFetching: queryResult.isFetching,
      isError: queryResult.isError,
      error: queryResult.error,
      data: queryResult.data,
      status: queryResult.status,
    });
  }, [queryResult.isLoading, queryResult.isFetching, queryResult.isError, queryResult.data, queryResult.status]);
  
  return queryResult;
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
