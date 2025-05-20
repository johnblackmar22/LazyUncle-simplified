import React, { useState, useEffect } from 'react';
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
  Progress,
  FormErrorMessage
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, loading, error, resetError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
  }>({});

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Contains number or special char
    if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'red';
    if (passwordStrength < 75) return 'yellow';
    return 'green';
  };

  const validateForm = () => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      displayName?: string;
    } = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    
    // Display name validation
    if (!displayName) {
      errors.displayName = 'Name is required';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 50) {
      errors.password = 'Password is too weak';
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await signUp(email, password, displayName);
      navigate('/onboarding');
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
              <FormControl isInvalid={!!validationErrors.displayName} isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
                {validationErrors.displayName && (
                  <FormErrorMessage>{validationErrors.displayName}</FormErrorMessage>
                )}
              </FormControl>
              
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
                    placeholder="Enter your password (min. 8 characters)"
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {password && (
                  <>
                    <Progress 
                      value={passwordStrength} 
                      colorScheme={getPasswordStrengthColor()} 
                      size="sm" 
                      mt={2} 
                    />
                    <Text fontSize="xs" mt={1}>
                      {passwordStrength < 50 && 'Weak password - add uppercase, lowercase, numbers, or symbols'}
                      {passwordStrength >= 50 && passwordStrength < 75 && 'Moderate password - consider adding more variety'}
                      {passwordStrength >= 75 && 'Strong password'}
                    </Text>
                  </>
                )}
                {validationErrors.password && (
                  <FormErrorMessage>{validationErrors.password}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl isInvalid={!!validationErrors.confirmPassword} isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
                {validationErrors.confirmPassword && (
                  <FormErrorMessage>{validationErrors.confirmPassword}</FormErrorMessage>
                )}
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