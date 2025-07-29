"use client"

import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Drawer } from "expo-router/drawer"
import { useAuth } from "../_layout"
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer"
import { View, StyleSheet, Image } from "react-native"
import { Avatar, Text, Divider, useTheme } from "react-native-paper"
import { useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { Home, User, Heart, BookOpen, CheckSquare, LogOut, Plus, Star } from "lucide-react-native"

function HeaderTitle() {
  return (
    <View style={styles.headerTitle}>
      <Text variant="titleLarge" style={styles.headerText}>
        Ludo List
      </Text>
      <Image source={require("../../app/assets/ludoimg.png")} style={styles.headerImage} resizeMode="contain" />
    </View>
  )
}

function CustomDrawerContent(props: any) {
  const { profile, isAdmin } = useAuth()
  const theme = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={[styles.userSection, { backgroundColor: theme.colors.primaryContainer }]}>
        <Avatar.Text size={60} label={profile?.first_name?.charAt(0) || "U"} style={styles.avatar} />
        <Text variant="titleMedium" style={styles.userName}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text variant="bodySmall" style={styles.userRole}>
          @{profile?.username} {isAdmin && "• Admin"}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <DrawerItem
        label="Feed"
        icon={({ color, size }) => <Home color={color} size={size} />}
        onPress={() => router.push("/(drawer)/feed")}
      />

      <DrawerItem
        label="Top Jogos"
        icon={({ color, size }) => <Star color={color} size={size} />}
        onPress={() => router.push("/(drawer)/top-games")}
      />

      <DrawerItem
        label="Minha Coleção"
        icon={({ color, size }) => <BookOpen color={color} size={size} />}
        onPress={() => router.push("/(drawer)/collection")}
      />

      <DrawerItem
        label="Lista de Desejos"
        icon={({ color, size }) => <Heart color={color} size={size} />}
        onPress={() => router.push("/(drawer)/wishlist")}
      />

      <DrawerItem
        label="Jogos Jogados"
        icon={({ color, size }) => <CheckSquare color={color} size={size} />}
        onPress={() => router.push("/(drawer)/played")}
      />

      {isAdmin && (
        <>
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Administração
          </Text>
          <DrawerItem
            label="Gerenciar Jogos"
            icon={({ color, size }) => <Plus color={color} size={size} />}
            onPress={() => router.push("/(drawer)/admin/games")}
          />
        </>
      )}

      <Divider style={styles.divider} />

      <DrawerItem
        label="Perfil"
        icon={({ color, size }) => <User color={color} size={size} />}
        onPress={() => router.push("/(drawer)/profile")}
      />

      <DrawerItem
        label="Sair"
        icon={({ color, size }) => <LogOut color={color} size={size} />}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  )
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: true,
          drawerStyle: {
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="feed"
          options={{
            drawerLabel: "Feed",
            headerTitle: () => <HeaderTitle />,
          }}
        />

        <Drawer.Screen
          name="top-games"
          options={{
            drawerLabel: "Top Jogos",
            title: "Top Jogos",
          }}
        />

        <Drawer.Screen
          name="collection"
          options={{
            drawerLabel: "Coleção",
            title: "Minha Coleção",
          }}
        />

        <Drawer.Screen
          name="wishlist"
          options={{
            drawerLabel: "Desejos",
            title: "Lista de Desejos",
          }}
        />

        <Drawer.Screen
          name="played"
          options={{
            drawerLabel: "Jogados",
            title: "Jogos Jogados",
          }}
        />

        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Perfil",
            title: "Meu Perfil",
          }}
        />

        <Drawer.Screen
          name="admin"
          options={{
            drawerLabel: "Admin",
            title: "Administração",
          }}
        />

        <Drawer.Screen
          name="game/[id]"
          options={{
            drawerLabel: "Jogo",
            title: "Detalhes do Jogo",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    marginBottom: 10,
  },
  userName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  userRole: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 10,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 0.7,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "bold",
    marginRight: 8,
  },
  headerImage: {
    width: 24,
    height: 24,
  },
})
