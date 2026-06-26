import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './index';
import { useTheme } from '../../providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.subtitle,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
  });
}

function ErrorFallback({
  fallbackMessage,
  message,
  onReset,
}: {
  fallbackMessage?: string;
  message: string;
  onReset: () => void;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unexpected error</Text>
      <Text style={styles.message}>{fallbackMessage ?? message}</Text>
      <Button label="Reload section" onPress={onReset} />
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          fallbackMessage={this.props.fallbackMessage}
          message={this.state.message}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
