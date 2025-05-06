'use client'

import { Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import NetworkSupportChecker from './components/NetworkSupportChecker'
import CustomConnectButton from './components/CustomConnectButton'
import AnimatedBackground from './components/AnimatedBackground'
import './styles/index.css'

export default function Home() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/pools')
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <NetworkSupportChecker />
      <Container className="min-h-screen py-16 relative z-10">
        <Card
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}
          className="landing-card"
        >
          <Flex direction="column" gap="8" align="center" justify="center" py="9">
            <Heading
              size="9"
              align="center"
              style={{
                background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.75rem',
                fontWeight: 800,
              }}
            >
              Private Asset Transfers
            </Heading>
            <Text
              size="5"
              align="center"
              style={{ color: 'rgba(255, 255, 255, 0.8)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}
            >
              Secure, anonymous transactions on Sui using zero-knowledge proofs and shielded pools.
            </Text>
            <Text
              size="3"
              align="center"
              style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}
            >
              Enjoy the privacy benefits of ZK technology with the performance and scalability of the Sui blockchain.
            </Text>

            <Flex
              direction={{ initial: 'column', sm: 'row' }}
              gap="4"
              mt="6"
              align="center"
              justify="center"
            >
              <CustomConnectButton />
              <Button
                size="4"
                onClick={handleGetStarted}
                style={{
                  background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  minWidth: '140px',
                  transition: 'all 0.2s ease',
                }}
                className="get-started-btn"
              >
                Get Started
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Container>
      
      <style jsx global>{`
        .get-started-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
        }
        
        body {
          background-color: #0f172a;
        }
      `}</style>
    </div>
  )
}

// Global styles can be added here if needed
