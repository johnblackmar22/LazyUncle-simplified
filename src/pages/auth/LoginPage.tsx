import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  Container,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  Divider,
  HStack,
  FormErrorMessage,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';
import { DEMO_MODE } from '../../services/firebase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { signIn, resetPassword, loading, error, resetError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const demoToastShown = useRef(false);

  useEffect(() => {
    if (DEMO_MODE && !demoToastShown.current) {
      demoToastShown.current = true;
      toast({
        title: "Demo Mode Available",
        description: "Firebase credentials not found. You can use demo mode to explore the app.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const validateForm = () => {
    const errors: {
      email?: string;
      password?: string;
    } = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleDemoMode = async () => {
    setDemoLoading(true);
    resetError();
    
    try {
      // Initialize demo data
      initializeDemoData();
      
      // Simulate login with demo credentials
      await signIn('demo@example.com', 'password');
      
      // Simulate loading for better UX
      setTimeout(() => {
        setDemoLoading(false);
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Demo mode error:', err);
      setDemoLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate email
    if (!resetEmail) {
      setResetEmailError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetEmailError('Email address is invalid');
      return;
    }
    
    try {
      await resetPassword(resetEmail);
      onClose();
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  // If we're in forced demo mode, show a notification banner
  const DemoModeBanner = () => {
    if (DEMO_MODE) {
      return (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <VStack align="start" spacing={1} w="100%">
            <Text fontWeight="bold">No Firebase credentials detected</Text>
            <Text>
              You can either:
            </Text>
            <Text fontSize="sm">• Use the "Try Demo Mode" button below to explore with sample data</Text>
            <Text fontSize="sm">• Set up Firebase credentials in a .env file for real authentication</Text>
          </VStack>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Box pt={10} pb={20} px={4} bg="gray.50" minH="100vh">
      <Container maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="md">
        <DemoModeBanner />
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">Sign In</Heading>
            <Text color="gray.500">
              Don't have an account? <Link to="/register" style={{ color: 'blue' }}>Register</Link>
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!validationErrors.email} isRequired>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <FormErrorMessage>{validationErrors.email}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!validationErrors.password} isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {validationErrors.password && (
                  <FormErrorMessage>{validationErrors.password}</FormErrorMessage>
                )}
              </FormControl>

              <Text alignSelf="flex-end" color="blue.500" fontSize="sm" cursor="pointer" onClick={onOpen}>
                Forgot Password?
              </Text>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Button
                mt={4}
                colorScheme="blue"
                isLoading={loading}
                type="submit"
                w="full"
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Divider my={4} />
          
          <VStack spacing={3}>
            <Text textAlign="center" fontSize="sm">
              Want to try LazyUncle without creating an account?
            </Text>
            <Button 
              colorScheme="green" 
              variant="solid"
              w="full"
              onClick={handleDemoMode}
              isLoading={demoLoading}
              loadingText="Loading Demo Data"
            >
              Try Demo Mode
            </Button>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Demo mode provides sample data to explore the application features
            </Text>
          </VStack>
        </VStack>
      </Container>

      {/* Forgot Password Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Your Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            <FormControl isInvalid={!!resetEmailError}>
              <FormLabel>Email Address</FormLabel>
              <Input 
                type="email" 
                value={resetEmail} 
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  setResetEmailError('');
                }}
                placeholder="Enter your email"
              />
              {resetEmailError && <FormErrorMessage>{resetEmailError}</FormErrorMessage>}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleResetPassword}
              isLoading={loading}
            >
              Send Reset Link
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LoginPage; 