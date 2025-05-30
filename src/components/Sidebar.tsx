import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  VStack, 
  Flex, 
  Link, 
  Text, 
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  MdDashboard, 
  MdPeople, 
  MdCardGiftcard, 
  MdSettings
} from 'react-icons/md';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { path: '/recipients', label: 'Recipients', icon: MdPeople },
    { path: '/settings', label: 'Settings', icon: MdSettings },
  ];

  return (
    <Box 
      as="aside" 
      w="250px" 
      bg={bgColor} 
      borderRight="1px" 
      borderColor={borderColor}
      h="calc(100vh - 4rem)"
      pt={3}
      data-testid="sidebar"
      className="sidebar"
    >
      <VStack spacing={1} align="stretch" px={3}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            as={RouterLink}
            to={item.path}
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            <Flex
              align="center"
              p={2.5}
              borderRadius="md"
              transition="all 0.2s"
              bg={isActive(item.path) ? 'brand.50' : 'transparent'}
              color={isActive(item.path) ? 'brand.500' : 'gray.600'}
              _hover={{
                bg: isActive(item.path) ? 'brand.50' : 'gray.100',
                color: isActive(item.path) ? 'brand.600' : 'gray.800',
              }}
            >
              <Icon as={item.icon} mr={3} boxSize={5} />
              <Text fontWeight={isActive(item.path) ? "medium" : "normal"}>
                {item.label}
              </Text>
            </Flex>
          </Link>
        ))}
      </VStack>
    </Box>
  );
}; 