import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Icon,
  Link,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';

// Use a simple div with icons to represent the menu items since we don't have react-icons yet
const NavItem = ({ icon, children, to }: { icon: string, children: React.ReactNode, to: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeColor = useColorModeValue('brand.500', 'brand.300');
  const activeBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="3"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        fontWeight={isActive ? 'semibold' : 'normal'}
        color={isActive ? activeColor : undefined}
        bg={isActive ? activeBg : undefined}
        _hover={{
          bg: activeBg,
        }}
      >
        <Text mr="2" fontSize="16px">{icon}</Text>
        {children}
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  // In a real app, check if user is logged in
  const isLoggedIn = false;
  
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!isLoggedIn) {
    // Don't render sidebar for non-authenticated users
    return null;
  }

  return (
    <Box
      position="fixed"
      left={0}
      w={'220px'}
      h="calc(100vh - 60px)"
      mt="60px" // Account for navbar height
      bg={sidebarBg}
      borderRight="1px"
      borderColor={borderColor}
      pt={4}
      display={{ base: 'none', md: 'block' }} // Hide on mobile
    >
      <Stack spacing={2}>
        <NavItem icon="📊" to="/dashboard">
          Dashboard
        </NavItem>
        <NavItem icon="👥" to="/recipients">
          Recipients
        </NavItem>
        <NavItem icon="➕" to="/recipients/add">
          Add Recipient
        </NavItem>
        <NavItem icon="🎁" to="/gifts">
          Gifts
        </NavItem>
        <NavItem icon="➕" to="/gifts/add">
          Add Gift
        </NavItem>
      </Stack>
    </Box>
  );
};

export default Sidebar; 