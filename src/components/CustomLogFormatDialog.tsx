import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Box,
  Alert,
  Code,
  Tabs,
  ScrollArea
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useLogFormatStore } from '../stores/logFormatStore';
import { CustomLogFormat } from '../types/log';
import { LogParser } from '../utils/logParser';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CustomLogFormatDialogProps {
  opened: boolean;
  onClose: () => void;
  editingFormatId?: string;
}

export default function CustomLogFormatDialog({
  opened,
  onClose,
  editingFormatId
}: CustomLogFormatDialogProps) {
  const { t } = useTranslation();
  const { addFormat, updateFormat, getFormatById } = useLogFormatStore();

  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [sample, setSample] = useState('');
  const [timestampGroup, setTimestampGroup] = useState<number | undefined>(undefined);
  const [levelGroup, setLevelGroup] = useState<number | undefined>(undefined);
  const [messageGroup, setMessageGroup] = useState<number | undefined>(undefined);
  const [traceIdGroup, setTraceIdGroup] = useState<number | undefined>(undefined);
  const [loggerGroup, setLoggerGroup] = useState<number | undefined>(undefined);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    result?: any;
    error?: string;
  } | null>(null);

  // 表单验证
  const [errors, setErrors] = useState<{
    name?: string;
    pattern?: string;
    sample?: string;
    levelGroup?: string;
    messageGroup?: string;
  }>({});

  // 加载编辑数据
  useEffect(() => {
    if (editingFormatId) {
      const format = getFormatById(editingFormatId);
      if (format) {
        setName(format.name);
        setPattern(format.pattern);
        setSample(format.sample || '');
        setTimestampGroup(format.groups.timestamp);
        setLevelGroup(format.groups.level);
        setMessageGroup(format.groups.message);
        setTraceIdGroup(format.groups.traceId);
        setLoggerGroup(format.groups.logger);
      }
    } else {
      // 重置表单
      resetForm();
    }
  }, [editingFormatId, opened]);

  // 重置表单
  const resetForm = () => {
    setName('');
    setPattern('');
    setSample('');
    setTimestampGroup(undefined);
    setLevelGroup(undefined);
    setMessageGroup(undefined);
    setTraceIdGroup(undefined);
    setLoggerGroup(undefined);
    setTestResult(null);
    setErrors({});
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = t('customLogFormat.errors.nameRequired');
    }

    if (!pattern.trim()) {
      newErrors.pattern = t('customLogFormat.errors.patternRequired');
    }

    if (!sample.trim()) {
      newErrors.sample = t('customLogFormat.errors.sampleRequired');
    }

    if (levelGroup === undefined) {
      newErrors.levelGroup = t('customLogFormat.errors.levelGroupRequired');
    }

    if (messageGroup === undefined) {
      newErrors.messageGroup = t('customLogFormat.errors.messageGroupRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 测试正则表达式
  const testRegex = () => {
    try {
      if (!pattern.trim() || !sample.trim()) {
        setTestResult({
          success: false,
          error: t('customLogFormat.errors.patternOrSampleMissing')
        });
        return;
      }

      const testFormat: CustomLogFormat = {
        id: 'test',
        name: 'Test Format',
        pattern,
        groups: {
          timestamp: timestampGroup,
          level: levelGroup || 1,
          message: messageGroup || 2,
          traceId: traceIdGroup,
          logger: loggerGroup
        },
        sample
      };

      const result = LogParser.testCustomFormat(testFormat);
      setTestResult(result);

    } catch (e: any) {
      setTestResult({
        success: false,
        error: e.message || t('customLogFormat.errors.invalidPattern')
      });
    }
  };

  // 保存格式
  const saveFormat = () => {
    if (!validateForm()) return;

    const formatData: Omit<CustomLogFormat, 'id'> = {
      name,
      pattern,
      sample,
      groups: {
        level: levelGroup!,
        message: messageGroup!
      }
    };

    if (timestampGroup !== undefined) {
      formatData.groups.timestamp = timestampGroup;
    }

    if (traceIdGroup !== undefined) {
      formatData.groups.traceId = traceIdGroup;
    }

    if (loggerGroup !== undefined) {
      formatData.groups.logger = loggerGroup;
    }

    if (editingFormatId) {
      updateFormat(editingFormatId, formatData);
    } else {
      addFormat(formatData);
    }

    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingFormatId ? t('customLogFormat.editFormat') : t('customLogFormat.addFormat')}
      size="lg"
    >
      <Tabs defaultValue="basic">
        <Tabs.List>
          <Tabs.Tab value="basic">{t('customLogFormat.tabs.basic')}</Tabs.Tab>
          <Tabs.Tab value="groups">{t('customLogFormat.tabs.captureGroups')}</Tabs.Tab>
          <Tabs.Tab value="test">{t('customLogFormat.tabs.test')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <Stack>
            <TextInput
              label={t('customLogFormat.name')}
              placeholder={t('customLogFormat.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Textarea
              label={t('customLogFormat.pattern')}
              placeholder={t('customLogFormat.patternPlaceholder')}
              description={t('customLogFormat.patternDescription')}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              error={errors.pattern}
              minRows={3}
              required
            />

            <Textarea
              label={t('customLogFormat.sample')}
              placeholder={t('customLogFormat.samplePlaceholder')}
              description={t('customLogFormat.sampleDescription')}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              error={errors.sample}
              minRows={2}
              required
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="groups" pt="md">
          <Stack>
            <Text size="sm" mb="xs">{t('customLogFormat.groupsDescription')}</Text>

            <NumberInput
              label={t('customLogFormat.levelGroup')}
              description={t('customLogFormat.levelGroupDescription')}
              placeholder="1"
              value={levelGroup}
              onChange={(value) => setLevelGroup(typeof value === 'number' ? value : undefined)}
              error={errors.levelGroup}
              min={1}
              required
            />

            <NumberInput
              label={t('customLogFormat.messageGroup')}
              description={t('customLogFormat.messageGroupDescription')}
              placeholder="2"
              value={messageGroup}
              onChange={(value) => setMessageGroup(typeof value === 'number' ? value : undefined)}
              error={errors.messageGroup}
              min={1}
              required
            />

            <NumberInput
              label={t('customLogFormat.timestampGroup')}
              description={t('customLogFormat.timestampGroupDescription')}
              placeholder="3"
              value={timestampGroup}
              onChange={(value) => setTimestampGroup(typeof value === 'number' ? value : undefined)}
              min={1}
            />

            <NumberInput
              label={t('customLogFormat.traceIdGroup')}
              description={t('customLogFormat.traceIdGroupDescription')}
              placeholder="4"
              value={traceIdGroup}
              onChange={(value) => setTraceIdGroup(typeof value === 'number' ? value : undefined)}
              min={1}
            />

            <NumberInput
              label={t('customLogFormat.loggerGroup')}
              description={t('customLogFormat.loggerGroupDescription')}
              placeholder="5"
              value={loggerGroup}
              onChange={(value) => setLoggerGroup(typeof value === 'number' ? value : undefined)}
              min={1}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="test" pt="md">
          <Stack>
            <Text size="sm" mb="xs">{t('customLogFormat.testDescription')}</Text>

            <Button onClick={testRegex} variant="light">
              {t('customLogFormat.testButton')}
            </Button>

            {testResult && (
              <Box mt="md">
                {testResult.success ? (
                  <Alert
                    icon={<IconCheck size={16} />}
                    title={t('customLogFormat.testSuccess')}
                    color="green"
                  >
                    <ScrollArea h={150} mt="xs">
                      <Code block>
                        {JSON.stringify(testResult.result, null, 2)}
                      </Code>
                    </ScrollArea>
                  </Alert>
                ) : (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title={t('customLogFormat.testFailed')}
                    color="red"
                  >
                    {testResult.error}
                  </Alert>
                )}
              </Box>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="space-between" mt="xl">
        <Button variant="outline" color="gray" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button color="blue" onClick={saveFormat}>
          {t('common.save')}
        </Button>
      </Group>
    </Modal>
  );
} 