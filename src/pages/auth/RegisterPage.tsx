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
  InputRightElement
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, loading, error, resetError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    try {
      await signUp(email, password, displayName);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <Box pt={10} pb={20} px={4} bg="gray.50" minH="100vh">
      <Container maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="md">
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">Create an Account</Heading>
            <Text color="gray.500">
              Already have an account? <Link to="/login" style={{ color: 'blue' }}>Sign In</Link>
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="displayName">
                <FormLabel>Name</FormLabel>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
              </FormControl>
              
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

              <Text fontSize="sm" color="blue.600">
                Demo Mode: Any email and password will work
              </Text>

              <Button
                mt={4}
                colorScheme="blue"
                isLoading={loading}
                type="submit"
                w="full"
              >
                Create Account
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
};

export default RegisterPage; 