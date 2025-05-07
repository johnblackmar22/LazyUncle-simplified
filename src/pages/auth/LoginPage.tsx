import React, { useState } from 'react';
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
  HStack
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, loading, error, resetError } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleDemoMode = () => {
    setDemoLoading(true);
    
    // Initialize demo data
    initializeDemoData();
    
    // Simulate loading for better UX
    setTimeout(() => {
      setDemoLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <Box pt={10} pb={20} px={4} bg="gray.50" minH="100vh">
      <Container maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="md">
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">Sign In</Heading>
            <Text color="gray.500">
              Don't have an account? <Link to="/register" style={{ color: 'blue' }}>Register</Link>
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email">
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl id="password">
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
              </FormControl>

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
    </Box>
  );
};

export default LoginPage; 