import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Heading, 
  HStack, 
  Button, 
  Container,
  useColorModeValue,
  Link,
  Text
} from '@chakra-ui/react';
import { useAuthStore } from '../store/authStore';
import SmallLogoJpeg from '../../Logos/Small logo.jpeg';

// Theme colors from logo
const ACCENT_BLUE = 'brand.700';
const ACCENT_ORANGE = 'orange.400';

function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <HStack spacing={2}>
      <img src={SmallLogoJpeg} alt="Lazy Uncle Logo" style={{ width: size, height: size }} />
      <Text fontWeight={900} fontSize="xl" letterSpacing={1}>
        <Box as="span" color={ACCENT_ORANGE}>Lazy</Box>
        <Box as="span" color={ACCENT_BLUE}>Uncle</Box>
      </Text>
    </HStack>
  );
}

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const navigate = useNavigate();
  
  return (
    <Box as="nav" bg={bgColor} py={4} boxShadow="sm">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <BrandLogo size={36} />
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
                  as={RouterLink}
                  to="/settings"
                  variant="ghost"
                  colorScheme="blue"
                >
                  Settings
                </Button>
                <Button 
                  onClick={async () => { await signOut(); navigate('/'); }} 
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