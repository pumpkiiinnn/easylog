import { Modal, TextInput, Button, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { fetch } from '@tauri-apps/plugin-http';
import { useTranslation } from 'react-i18next';

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
}

interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userInfo?: {
      name: string;
      avatar: string;
      email: string;
      subscription: 'free' | 'pro' | 'enterprise';
    }
  };
}

export function LoginModal({ opened, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUserData } = useUserStore();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      if (!email || !password) {
        setError(t('login.fieldsRequired'));
        return;
      }
      
      setLoading(true);
      setError('');
      
      const response = await fetch('https://api.ai-ia.cc/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = (await response.json()) as LoginResponse;
      console.log('Login response:', data);
      
      if (data.code === 200) {
        const defaultUserInfo = {
          name: email.split('@')[0],
          avatar: '',
          email: email,
          subscription: 'free' as const
        };
        
        console.log('Setting user data:', data.data.token, defaultUserInfo);
        await setUserData(data.data.token, defaultUserInfo);
        onClose();
      } else {
        setError(data.message || t('login.unknownError'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={t('login.title')}
      centered
    >
      <Stack>
        <TextInput
          required
          label="Email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <TextInput
          required
          type="password"
          label={t('login.password')}
          placeholder={t('login.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        {error && <Text c="red" size="sm">{error}</Text>}
        <Button 
          onClick={handleSubmit}
          loading={loading}
        >
          {t('login.submit')}
        </Button>
      </Stack>
    </Modal>
  );
} 