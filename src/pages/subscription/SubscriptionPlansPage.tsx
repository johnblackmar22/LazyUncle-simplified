import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  List,
  ListItem,
  ListIcon,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Switch,
  Badge,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { subscriptionPlans, getYearlyPrice } from '../../services/subscription/plans';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPlansPage() {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  const handleSubscribe = (planId: string) => {
    // In a real app, this would navigate to checkout with the selected plan
    navigate(`/checkout?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`);
  };

  return (
    <Box py={12}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <Heading as="h1" size="2xl">
            Subscription Plans
          </Heading>
          
          <Text fontSize="xl" textAlign="center" color={textColor} maxW="800px">
            Choose the perfect plan for your automatic gifting needs. 
            All plans include our core service of automatically recommending and sending gifts.
          </Text>
          
          <HStack mb={8} spacing={4}>
            <Text fontWeight="bold">Monthly</Text>
            <Switch
              size="lg"
              isChecked={isYearly}
              onChange={() => setIsYearly(!isYearly)}
              colorScheme="green"
            />
            <Text fontWeight="bold">Yearly</Text>
            <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="md">
              Save 20%
            </Badge>
          </HStack>

          <Stack
            direction={{ base: 'column', lg: 'row' }}
            textAlign="center"
            justify="center"
            spacing={{ base: 4, lg: 10 }}
            py={10}
          >
            {subscriptionPlans.map((plan) => {
              const price = isYearly 
                ? getYearlyPrice(plan.id) 
                : plan.price;
                
              const isPopular = plan.id === 'standard';
              
              return (
                <Box
                  key={plan.id}
                  mb={4}
                  shadow="lg"
                  borderWidth="1px"
                  alignSelf={{ base: 'center', lg: isPopular ? 'flex-start' : 'center' }}
                  borderColor={isPopular ? 'brand.500' : borderColor}
                  borderRadius={'xl'}
                  position="relative"
                  width={{ base: '100%', md: '350px' }}
                >
                  {isPopular && (
                    <Box
                      position="absolute"
                      top="-16px"
                      left="50%"
                      transform="translateX(-50%)"
                    >
                      <Badge
                        borderRadius="full"
                        px={3}
                        py={1}
                        colorScheme="green"
                        fontSize="md"
                      >
                        Most Popular
                      </Badge>
                    </Box>
                  )}

                  <Box py={4} px={12} position="relative">
                    <Heading as="h3" fontSize="2xl" fontWeight="bold" mb={2}>
                      {plan.name}
                    </Heading>
                    <Text fontWeight="500" fontSize="md" mb={2}>
                      {plan.description}
                    </Text>
                    <Box display="flex" justifyContent="center" alignItems="baseline" my={8}>
                      <Text fontSize="5xl" fontWeight="900">
                        ${typeof price === 'number' ? price.toFixed(2) : '??'}
                      </Text>
                      <Text fontSize="md" ml={2} color={textColor}>
                        /{isYearly ? 'year' : 'month'}
                      </Text>
                    </Box>
                    <Button
                      size="lg"
                      w="full"
                      colorScheme={isPopular ? 'brand' : 'blue'}
                      variant={isPopular ? 'solid' : 'outline'}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      Start {isYearly ? 'Yearly' : 'Monthly'} Plan
                    </Button>
                  </Box>
                  <VStack
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    py={4}
                    borderBottomRadius={'xl'}
                  >
                    <List spacing={3} textAlign="start" px={12} py={6}>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index}>
                          <ListIcon as={CheckIcon} color="green.500" />
                          {feature}
                        </ListItem>
                      ))}
                    </List>
                  </VStack>
                </Box>
              );
            })}
          </Stack>
        </VStack>
      </Container>
    </Box>
  );
} 