import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { UserPlus, Crown, Shield, Trash2 } from 'lucide-react-native';
import {
  Screen,
  Text,
  PageHeader,
  Card,
  Badge,
  Avatar,
  Input,
  Button,
  BottomSheet,
  Loading,
  ErrorState,
} from '../../../components/ui';
import { spacing, useTheme } from '../../../constants/theme';
import { gamesApi, membersApi } from '../../../lib/services';
import { apiErrorMessage } from '../../../lib/api';
import { roleLabels } from '../../../lib/labels';
import type { MemberRole, ProjectMember } from '../../../lib/types';

export default function MembersScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const gameQuery = useQuery({ queryKey: ['game', id], queryFn: () => gamesApi.get(id) });
  const membersQuery = useQuery({
    queryKey: ['members', id],
    queryFn: () => membersApi.list(id),
  });

  const isAdmin = gameQuery.data?.myRole === 'admin';
  const ownerId = gameQuery.data?.ownerId;

  const [addOpen, setAddOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProjectMember | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['members', id] });
    void qc.invalidateQueries({ queryKey: ['game', id] });
  };

  const addMutation = useMutation({
    mutationFn: () => membersApi.add(id, { username: username.trim() }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidate();
      setUsername('');
      setAddError(null);
      setAddOpen(false);
    },
    onError: (e) => setAddError(apiErrorMessage(e, 'Üye eklenemedi.')),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) =>
      membersApi.updateRole(id, memberId, role),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidate();
      setSelected(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.remove(id, memberId),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidate();
      setSelected(null);
    },
  });

  const AddButton = isAdmin ? (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAddOpen(true);
      }}
      hitSlop={8}
      style={[styles.iconBtn, { backgroundColor: colors.accent }]}
    >
      <UserPlus size={20} color={colors.onAccent} />
    </Pressable>
  ) : undefined;

  return (
    <Screen padded>
      <PageHeader title="Üyeler" subtitle="Ekip" back right={AddButton} />

      {membersQuery.isLoading ? (
        <Loading />
      ) : membersQuery.isError ? (
        <ErrorState message={apiErrorMessage(membersQuery.error)} onRetry={() => membersQuery.refetch()} />
      ) : (
        <FlatList
          data={membersQuery.data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isOwner = item.playerId === ownerId;
            const canManage = isAdmin && !isOwner;
            return (
              <Card onPress={canManage ? () => setSelected(item) : undefined}>
                <View style={styles.memberRow}>
                  <Avatar name={item.player?.username} uri={item.player?.avatarUrl} size={42} />
                  <View style={styles.memberInfo}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.player?.username ?? '—'}
                    </Text>
                    {item.player?.email ? (
                      <Text variant="caption" tone="tertiary" numberOfLines={1}>
                        {item.player.email}
                      </Text>
                    ) : null}
                  </View>
                  {isOwner ? (
                    <Badge label="Kurucu" variant="accent" />
                  ) : (
                    <Badge
                      label={roleLabels[item.role]}
                      variant={item.role === 'admin' ? 'accent' : 'neutral'}
                    />
                  )}
                </View>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.gap }} />}
        />
      )}

      {/* Üye ekle */}
      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text variant="heading" style={styles.sheetTitle}>
          Üye ekle
        </Text>
        <View style={styles.sheetForm}>
          <Input
            label="Kullanıcı adı"
            value={username}
            onChangeText={setUsername}
            placeholder="kullanici_adi"
            autoCapitalize="none"
            error={addError ?? undefined}
          />
          <Button label="Ekle" onPress={() => addMutation.mutate()} loading={addMutation.isPending} />
        </View>
      </BottomSheet>

      {/* Üye yönetimi */}
      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Text variant="heading" style={styles.sheetTitle}>
              {selected.player?.username}
            </Text>
            <View style={styles.actions}>
              <ActionRow
                icon={
                  selected.role === 'admin' ? (
                    <Shield size={20} color={colors.textPrimary} />
                  ) : (
                    <Crown size={20} color={colors.textPrimary} />
                  )
                }
                label={selected.role === 'admin' ? 'Üye yap' : 'Yönetici yap'}
                onPress={() =>
                  roleMutation.mutate({
                    memberId: selected.id,
                    role: selected.role === 'admin' ? 'member' : 'admin',
                  })
                }
              />
              <ActionRow
                icon={<Trash2 size={20} color={colors.accent} />}
                label="Projeden çıkar"
                destructive
                onPress={() => removeMutation.mutate(selected.id)}
              />
            </View>
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.action, { backgroundColor: colors.frame }]}>
      {icon}
      <Text variant="bodyMedium" style={{ color: destructive ? colors.accent : colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberInfo: { flex: 1 },
  sheetTitle: { marginBottom: spacing.lg },
  sheetForm: { gap: spacing.lg },
  actions: { gap: spacing.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 15,
  },
});
