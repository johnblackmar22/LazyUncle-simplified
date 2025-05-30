import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Code, VStack, Divider, Button, useToast, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { DEMO_MODE, auth, db } from '../services/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const EnvDebug: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Not tested');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Not tested');
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Only collect in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        // @ts-ignore - Access Vite environment variables
        const allEnvVars = { ...process.env };
        
        // Remove any functions or non-string values
        const cleanedVars: Record<string, string> = {};
        Object.keys(allEnvVars).forEach(key => {
          const value = allEnvVars[key];
          if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
            cleanedVars[key] = String(value);
          }
        });
        
        setEnvVars(cleanedVars);
      } catch (err) {
        console.error('Error accessing environment variables:', err);
        setError('Error accessing environment variables');
      }
    }
  }, []);

  const testFirebaseAuth = async () => {
    try {
      setFirebaseStatus('Testing...');
      setError(null);
      
      // Check if we're in demo mode
      if (DEMO_MODE) {
        setFirebaseStatus('Warning: Running in demo mode. Firebase Auth will not connect to real Firebase.');
        toast({
          title: 'Demo Mode Detected',
          description: 'Cannot test real Firebase Auth in demo mode.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const result = await signInAnonymously(auth);
      setFirebaseStatus(`Connected successfully! User ID: ${result.user.uid}`);
      toast({
        title: 'Firebase Auth Test',
        description: 'Successfully connected to Firebase Authentication!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Firebase Auth test failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setFirebaseStatus(`Error: ${errorMsg}`);
      setError(errorMsg);
      toast({
        title: 'Firebase Auth Test Failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const testFirestore = async () => {
    try {
      setFirestoreStatus('Testing...');
      setError(null);
      
      // Check if we're in demo mode
      if (DEMO_MODE) {
        setFirestoreStatus('Warning: Running in demo mode. Firestore will not connect to real Firebase.');
        toast({
          title: 'Demo Mode Detected',
          description: 'Cannot test real Firestore in demo mode.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const recipientsQuery = query(collection(db, 'recipients'), limit(1));
      const querySnapshot = await getDocs(recipientsQuery);
      setFirestoreStatus(`Connected successfully! Found ${querySnapshot.size} documents`);
      toast({
        title: 'Firestore Test',
        description: `Successfully connected to Firestore! Found ${querySnapshot.size} documents.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Firestore test failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setFirestoreStatus(`Error: ${errorMsg}`);
      setError(errorMsg);
      toast({
        title: 'Firestore Test Failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box p={5} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" mb={5} maxW="800px">
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Environment & Firebase Debug Panel</Heading>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Firebase Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
        
        <Box>
          <Text fontWeight="bold">Demo Mode: {DEMO_MODE ? 'ON' : 'OFF'}</Text>
          {DEMO_MODE && (
            <Alert status="warning" mt={2} size="sm" borderRadius="md">
              <AlertIcon />
              Demo mode is active. Firebase credentials will not be used.
            </Alert>
          )}
        </Box>
        
        <Divider />
        
        <Box>
          <Heading size="sm" mb={2}>Firebase Connectivity Tests</Heading>
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontWeight="bold">Firebase Auth Status:</Text>
              <Text>{firebaseStatus}</Text>
              <Button mt={2} colorScheme="blue" onClick={testFirebaseAuth} size="sm">
                Test Firebase Auth
              </Button>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Firestore Status:</Text>
              <Text>{firestoreStatus}</Text>
              <Button mt={2} colorScheme="green" onClick={testFirestore} size="sm">
                Test Firestore
              </Button>
            </Box>
          </VStack>
        </Box>
        
        <Divider />
        
        <Box>
          <Heading size="sm" mb={2}>Environment Variables</Heading>
          <VStack align="stretch" spacing={2}>
            {Object.entries(envVars)
              .filter(([key]) => key.startsWith('VITE_'))
              .map(([key, value]) => (
                <Box key={key}>
                  <Text fontWeight="bold">{key}:</Text>
                  <Code>{key.includes('KEY') || key.includes('ID') ? 
                    `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : 
                    value}
                  </Code>
                </Box>
              ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default EnvDebug; 