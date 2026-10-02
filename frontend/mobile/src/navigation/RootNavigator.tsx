import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Lottery } from '@lottery/shared';
// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen.js';
import { RegisterScreen } from '../screens/auth/RegisterScreen.js';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen.js';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen.js';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen.js';

// Main Screens
import { HomeScreen } from '../screens/HomeScreen.js';
import { LotteriesScreen } from '../screens/LotteriesScreen.js';
import { LotteryDetailScreen } from '../screens/LotteryDetailScreen.js';
import { BuyTicketScreen } from '../screens/BuyTicketScreen.js';
import { TicketsScreen } from '../screens/TicketsScreen.js';
import { WalletScreen } from '../screens/WalletScreen.js';
import { WinnersScreen } from '../screens/WinnersScreen.js';
import { ProfileScreen } from '../screens/ProfileScreen.js';

export type MainTab = 'home' | 'lotteries' | 'tickets' | 'wallet' | 'winners' | 'profile';
export type ScreenRoute =
  | { type: 'tab'; tab: MainTab }
  | { type: 'lottery-detail'; lottery: Lottery; previousTab: MainTab }
  | { type: 'buy-ticket'; lottery: Lottery; previousTab: MainTab }
  | { type: 'login'; returnRoute?: ScreenRoute }
  | { type: 'register'; returnRoute?: ScreenRoute }
  | { type: 'forgot-password' }
  | { type: 'reset-password' }
  | { type: 'verify-email'; email?: string };

export const RootNavigator: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>({
    type: 'tab',
    tab: 'home',
  });

  const activeTab: MainTab =
    currentRoute.type === 'tab'
      ? currentRoute.tab
      : currentRoute.type === 'lottery-detail' || currentRoute.type === 'buy-ticket'
      ? currentRoute.previousTab
      : 'home';

  const navigateToTab = (tab: MainTab) => {
    setCurrentRoute({ type: 'tab', tab });
  };

  const isAuthStack =
    currentRoute.type === 'login' ||
    currentRoute.type === 'register' ||
    currentRoute.type === 'forgot-password' ||
    currentRoute.type === 'reset-password' ||
    currentRoute.type === 'verify-email';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.container}>
        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {currentRoute.type === 'tab' && currentRoute.tab === 'home' && (
            <HomeScreen
              onNavigateLotteries={() => navigateToTab('lotteries')}
              onSelectLottery={(lottery) =>
                setCurrentRoute({
                  type: 'lottery-detail',
                  lottery,
                  previousTab: 'home',
                })
              }
              onNavigateWallet={() => navigateToTab('wallet')}
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: { type: 'tab', tab: 'home' },
                })
              }
            />
          )}

          {currentRoute.type === 'tab' && currentRoute.tab === 'lotteries' && (
            <LotteriesScreen
              onSelectLottery={(lottery) =>
                setCurrentRoute({
                  type: 'lottery-detail',
                  lottery,
                  previousTab: 'lotteries',
                })
              }
            />
          )}

          {currentRoute.type === 'tab' && currentRoute.tab === 'tickets' && (
            <TicketsScreen
              onBrowseLotteries={() => navigateToTab('lotteries')}
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: { type: 'tab', tab: 'tickets' },
                })
              }
            />
          )}

          {currentRoute.type === 'tab' && currentRoute.tab === 'wallet' && (
            <WalletScreen
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: { type: 'tab', tab: 'wallet' },
                })
              }
            />
          )}

          {currentRoute.type === 'tab' && currentRoute.tab === 'winners' && (
            <WinnersScreen
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: { type: 'tab', tab: 'winners' },
                })
              }
            />
          )}

          {currentRoute.type === 'tab' && currentRoute.tab === 'profile' && (
            <ProfileScreen
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: { type: 'tab', tab: 'profile' },
                })
              }
              onNavigateRegister={() =>
                setCurrentRoute({
                  type: 'register',
                  returnRoute: { type: 'tab', tab: 'profile' },
                })
              }
            />
          )}

          {/* Sub Screens */}
          {currentRoute.type === 'lottery-detail' && (
            <LotteryDetailScreen
              lottery={currentRoute.lottery}
              onBack={() => setCurrentRoute({ type: 'tab', tab: currentRoute.previousTab })}
              onBuyTicket={(lottery) =>
                setCurrentRoute({
                  type: 'buy-ticket',
                  lottery,
                  previousTab: currentRoute.previousTab,
                })
              }
            />
          )}

          {currentRoute.type === 'buy-ticket' && (
            <BuyTicketScreen
              lottery={currentRoute.lottery}
              onBack={() =>
                setCurrentRoute({
                  type: 'lottery-detail',
                  lottery: currentRoute.lottery,
                  previousTab: currentRoute.previousTab,
                })
              }
              onSuccess={() => setCurrentRoute({ type: 'tab', tab: 'tickets' })}
              onNavigateWallet={() => setCurrentRoute({ type: 'tab', tab: 'wallet' })}
            />
          )}

          {/* Auth Screens */}
          {currentRoute.type === 'login' && (
            <LoginScreen
              onNavigateRegister={() =>
                setCurrentRoute({
                  type: 'register',
                  returnRoute: currentRoute.returnRoute,
                })
              }
              onNavigateForgotPassword={() =>
                setCurrentRoute({ type: 'forgot-password' })
              }
              onLoginSuccess={() => {
                if (currentRoute.returnRoute) {
                  setCurrentRoute(currentRoute.returnRoute);
                } else {
                  setCurrentRoute({ type: 'tab', tab: 'home' });
                }
              }}
            />
          )}

          {currentRoute.type === 'register' && (
            <RegisterScreen
              onNavigateLogin={() =>
                setCurrentRoute({
                  type: 'login',
                  returnRoute: currentRoute.returnRoute,
                })
              }
              onRegisterSuccess={(email) =>
                setCurrentRoute({ type: 'verify-email', email })
              }
            />
          )}

          {currentRoute.type === 'forgot-password' && (
            <ForgotPasswordScreen
              onBackToLogin={() => setCurrentRoute({ type: 'login' })}
              onNavigateReset={() => setCurrentRoute({ type: 'reset-password' })}
            />
          )}

          {currentRoute.type === 'reset-password' && (
            <ResetPasswordScreen
              onBackToLogin={() => setCurrentRoute({ type: 'login' })}
            />
          )}

          {currentRoute.type === 'verify-email' && (
            <VerifyEmailScreen
              email={currentRoute.email}
              onVerificationComplete={() => setCurrentRoute({ type: 'login' })}
              onBackToLogin={() => setCurrentRoute({ type: 'login' })}
            />
          )}
        </View>

        {/* Bottom Tab Bar (hidden when in auth flow) */}
        {!isAuthStack && (
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('home')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'home' && styles.navIconActive,
                ]}
              >
                🏠
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'home' && styles.navLabelActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('lotteries')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'lotteries' && styles.navIconActive,
                ]}
              >
                🎰
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'lotteries' && styles.navLabelActive,
                ]}
              >
                Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('tickets')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'tickets' && styles.navIconActive,
                ]}
              >
                🎟️
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'tickets' && styles.navLabelActive,
                ]}
              >
                Tickets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('wallet')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'wallet' && styles.navIconActive,
                ]}
              >
                💳
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'wallet' && styles.navLabelActive,
                ]}
              >
                Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('winners')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'winners' && styles.navIconActive,
                ]}
              >
                🏆
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'winners' && styles.navLabelActive,
                ]}
              >
                Winners
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('profile')}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === 'profile' && styles.navIconActive,
                ]}
              >
                👤
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === 'profile' && styles.navLabelActive,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 2,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  navLabelActive: {
    color: '#3b82f6',
  },
});
