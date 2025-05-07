import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Heading, 
  HStack, 
  Button, 
  Container,
  useColorModeValue,
  Link
} from '@chakra-ui/react';
import { useAuthStore } from '../store/authStore';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box as="nav" bg={bgColor} py={4} boxShadow="sm">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Heading size="lg" color="brand.500">LazyUncle</Heading>
          </Link>
          
          <HStack spacing={4}>
            {user ? (
              <>
                <Button 
                  as={RouterLink} 
                  to="/dashboard" 
                  variant="ghost" 
                  colorScheme="blue"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={() => signOut()} 
                  variant="outline" 
                  colorScheme="blue"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  as={RouterLink} 
                  to="/login" 
                  variant="ghost" 
                  colorScheme="blue"
                >
                  Sign In
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/register" 
                  colorScheme="blue"
                >
                  Register
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}; 