'use client';

import { Box, Button, Flex } from '@sanity/ui';
import { set, type StringInputProps } from 'sanity';
import { useCallback } from 'react';
import { generateSecurePassword } from '../lib/generatePassword';

export function PasswordInput(props: StringInputProps) {
  const { onChange, readOnly } = props;

  const handleGenerate = useCallback(() => {
    onChange(set(generateSecurePassword()));
  }, [onChange]);

  return (
    <Flex gap={2} align="center">
      <Box flex={1}>{props.renderDefault(props)}</Box>
      <Button
        text="Generate"
        mode="default"
        tone="primary"
        onClick={handleGenerate}
        disabled={readOnly}
      />
    </Flex>
  );
}
