import { AxiosError, isAxiosError } from 'axios';
import { ApiClientPublic } from 'lib/axios/Api';
import { refreshAccessToken } from 'lib/axios/refreshToken';
import NextAuth from 'next-auth/next';
import { decode, JWT } from 'next-auth/jwt';
import CredentialProvider from 'next-auth/providers/credentials';

type AuthUser = {
    user: {
        token: {
            accessToken: string;
            refreshToken: string;
        };
        id: string;
        username: string;
        role: string;
    };
};

type Credential = {
    usernameOrEmail: string;
    password: string;
};

type Token = {
    access_token: string;
    refresh_token: string;
    id: string;
};

const providers = [
    CredentialProvider({
        name: 'Credential',
        credentials: {},
        authorize: async (credentials: Credential) => {
            const payload = {
                username: credentials.usernameOrEmail,
                password: credentials.password,
            };
            const { data } = await ApiClientPublic.post('/auth/signin', {
                ...payload,
            }).catch((error) => {
                if (isAxiosError(error)) {
                    return Promise.reject(
                        new Error(error.response?.data.message)
                    );
                }
                throw new Error(error);
            });

            if (data) {
                return data;
            }
        },
    }),
];

const callbacks = {
    async signIn() {
        const isAllowedToSignIn = true;
        if (isAllowedToSignIn) {
            return true;
        } else {
            return '/auth/sign-in';
        }
    },
    async jwt({ token, user }: any) {
        if (user) {
            token.token = {
                access_token: user.accessToken,
                refresh_token: user.refreshToken,
            };

            token.user = user.user;
        }

        return token;
    },

    async session({ session, token }: any) {
        session.user = {
            token: {
                refresh_token: token.token.refresh_token,
                access_token: token.token.access_token,
            },
            ...token.user,
        };
        return session;
    },
};

const pages = {
    error: '/auth/sign-in',
};

const Options = {
    pages,
    providers,
    callbacks,
};

// eslint-disable-next-line import/no-anonymous-default-export
export default NextAuth(Options);
