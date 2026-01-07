import React, { useEffect, useState } from "react";
import {
    Row,
    Col,
    Layout,
    Card,
    Typography, Button
} from "antd";
import {
    layoutStyles,
    titleStyles,
    imageContainer,
    textStyles, viewSecretCodeCss,
    secretCodeCss,
    verificationBtnsWrapper
} from "./styles";
import {
    multiFactor,
    TotpSecret,
    getAuth,
    isSignInWithEmailLink,
    signInWithEmailLink, TotpMultiFactorGenerator, User
} from "firebase/auth";
import QRCode from "react-qr-code";
import { Form, Input } from "@pankod/refine-antd";
import { LoadingOutlined } from "@ant-design/icons";
import { IResourceComponentsProps, useApiUrl, useCustom, useCustomMutation, useGetIdentity, useGo, useNavigation } from "@refinedev/core";
import { useSearchParams } from "react-router-dom";
import { IRefineUser } from "../../interfaces";
import { firebaseApp } from "../../utils/firebaseConfig";

const { Title } = Typography;

type ScreenSelection = 'email-verification' | 'email-send' | 'enrollment' | 'code-verification' | 'already-enrolled' | 're-sign-prompt';
type OnScreenError = Omit<ScreenSelection, 'email-send'> | null;

export const TwoFactorVerificationPage: React.FC<IResourceComponentsProps> = () => {

    const apiUrl = useApiUrl();

    const { mutate, isLoading } = useCustomMutation();

    const { data: enrolledData, isLoading: isCheckLoading } = useCustom({
        url: `${apiUrl}/2fa/check-enrollment`,
        method: 'get'
    });

    const go = useGo()
    const [search, _] = useSearchParams();

    console.log('search', search.get('goto'));

    const [form] = Form.useForm();

    const { data: user } = useGetIdentity<IRefineUser>();

    const [isAlreadyEnrolled, setAlreadyEnrolled] = useState<boolean>(false);

    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [secret, setSecret] = useState<TotpSecret | null>(null);
    const [showSecret, setShowSecret] = useState<boolean>(false);

    const [screen, setScreen] = useState<ScreenSelection>("email-verification");
    const [error, setError] = useState<OnScreenError>(null);

    const [prompt, setPrompt] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth(firebaseApp);

        if (user && isSignInWithEmailLink(auth, window.location.href)) {
            setScreen('enrollment')
            signInWithEmailLink(auth, user.email, window.location.href).then(async (credential) => {
                const multiFactorSession = await multiFactor(credential.user).getSession();
                const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
                const totpUri = totpSecret.generateQrCodeUrl(
                    user.email,
                    "Televeda"
                );

                setQrCodeData(totpUri)
                setSecret(totpSecret);
            }).catch((error) => {
                console.error('Detailed error:', {
                    code: error.code,
                    message: error.message,
                    fullError: error
                });
                setScreen('email-verification');
                switch (error.code) {
                    // https://firebase.google.com/docs/auth/admin/errors
                    // for now I'll redirect the user to log in again if we don't have a valid email // don't have the cookie
                    case "auth/invalid-email":
                        const currentURL = new URL(window.location.href);
                        if (!currentURL.searchParams.get("apiKey")) {
                            setPrompt('Something went wrong. Try sending email again in a few minutes!');
                            console.log("No valid key from redirect.");
                            break;
                        }
                        window.location.href = `/login?goto=${search.get('goto') || 'admin/surveys'}&key=totp-auth`;
                        break;
                    // need to reset the link
                    case "auth/invalid-action-code":
                        setPrompt('Link is expired. Try sending email again!');
                        break;
                    default:
                        setPrompt('Something went wrong. Try sending email again in a few minutes!');
                }
            })
        }
    }, [user]);

    useEffect(() => {
        if(screen !== 'email-verification') {
            setPrompt(null);
        }
    }, [screen]);

    useEffect(() => {
        if (!isCheckLoading) {
            const isEnrolled = enrolledData?.data.isEnrolled;
            const isActive = enrolledData?.data.isActive;

            setAlreadyEnrolled(isEnrolled);

            if (isEnrolled && isActive) {
                setScreen('already-enrolled');
            }

            if (isEnrolled && !isActive) {
                setScreen('re-sign-prompt')
            }
        }
    }, [enrolledData]);

    const onGenerate = async () => {
        const currentUser = getAuth(firebaseApp).currentUser
        let intercept = false;

        if (currentUser && currentUser.emailVerified) {
            console.log('User already loggin in, re-checking...');

            const multiFactorSession = await multiFactor(currentUser).getSession();

            await TotpMultiFactorGenerator.generateSecret(multiFactorSession).then((totpSecret) => {
                const totpUri = totpSecret.generateQrCodeUrl(
                    user?.email,
                    "Televeda"
                );

                setScreen('enrollment');
                setPrompt('You are already verified. Please continue.');
                setQrCodeData(totpUri)
                setSecret(totpSecret);
                intercept = true;
            }).catch((error: unknown) => {
                console.log('Error while checking loggin-in user: ', error);
            })
        }

        if (intercept) return;

        mutate({
            url: `${apiUrl}/2fa/generate-link`,
            method: 'post',
            values: {
                goto: search.get('goto') || 'admin/surveys'
            }
        }, {
            onSuccess: (() => {
                setScreen('email-send');
            }),
            onError: ((error: unknown) => {
                setScreen('email-send');
                setError('email-verification');
                console.log('error info', error);
            })
        })
    }

    const onRetryWithError = () => {
        setError(null);
        if (isAlreadyEnrolled) {
            setScreen('already-enrolled');
        }
        setScreen('email-verification');
    }

    const onVerificiation = async (values: any) => {

        const auth = getAuth(firebaseApp);
        const currentUser = auth.currentUser;

        try {
            const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
                secret!,
                values.otpCode
            );
            if (currentUser) {
                multiFactor(currentUser).enroll(multiFactorAssertion, user?.firstName ?? "").then(() => {
                    setTOTPCookie(currentUser);
                    auth.signOut();
                }).catch(() => {
                    setPrompt('Wrong code! Please try again.');
                })
            }
            else {
                setError('code-verification');
            }
        } catch {
            setError('code-veritication');
        }
    }

    const setTOTPCookie = async (currentUser: User) => {
        const idToken = await currentUser?.getIdToken(true);

        mutate({
            url: `${apiUrl}/2fa/cookie`,
            method: 'post',
            values: {
                idToken
            }
        }, {
            onSuccess: (() => {
                go({to: search.get('goto') ? `../${search.get('goto')?.substring(6)}` : '../surveys', type: 'replace'});
            }),
            onError: ((error: unknown) => {
                setPrompt('Something went wrong! Please try again later.');
                console.log('Error while creating 2fa cookie', error);
            })
        })

    }


    const CardTitle = (
        <Title level={3} style={titleStyles}>
            Two-factor Authentication
        </Title>
    );

    if (isCheckLoading) {
        return (
            <Layout style={layoutStyles}>
                <LoadingOutlined size={100} />
            </Layout>
        )
    }

    return (
        <Layout style={layoutStyles}>
            <Row
                justify="center"
                align="middle"
                style={{ height: '100%' }}
            >
                <Col xs={22}>
                    <div style={{ maxWidth: "550px", margin: "auto" }}>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            {prompt && <p style={{ fontSize: 18, color: 'white' }}>{prompt}</p>}
                        </div>
                        <div style={imageContainer}>
                            <img src={"/televeda/img/televeda-logo-lobby.svg"}alt="Televeda" />
                        </div>
                        <Card title={CardTitle} style={{ textAlign: 'center' }} headStyle={{ borderBottom: 0 }}>
                            {
                                error &&
                                <>
                                    <p style={{ ...textStyles, color: 'red' }}>
                                        Something went wrong. Please try again later.
                                    </p>

                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => onRetryWithError()}
                                        loading={isLoading}
                                    >
                                        Retry
                                    </Button>
                                </>
                            }

                            {
                                !error && screen === 'email-verification' &&
                                <>
                                    <p style={textStyles}>
                                        <b>Step One</b>
                                    </p>
                                    <p style={textStyles}>
                                        <b>We need to know that is you. A link to your email address will be send for verification.</b>
                                    </p>

                                    {qrCodeData &&
                                        <QRCode
                                            style={{ padding: 10, background: 'white' }}
                                            value={qrCodeData}
                                        >
                                        </QRCode>
                                    }

                                    <Button
                                        type="primary"
                                        style={{ marginTop: 30 }}
                                        size="large"
                                        onClick={() => onGenerate()}
                                        loading={isLoading}
                                    >
                                        Send Code
                                    </Button>

                                </>
                            }

                            {
                                !error && screen === 'email-send' &&
                                <>
                                    <p style={textStyles}>
                                        <b>Step Two</b>
                                    </p>

                                    <p style={textStyles}>
                                        <b>An email link has been send to {user?.email}.&#10;Follow the link in the email to continue. If you have received the email you can close this page.</b>
                                    </p>

                                    <Button
                                        type="primary"
                                        style={{ marginTop: 30 }}
                                        size="large"
                                        onClick={() => onGenerate()}
                                        loading={isLoading}
                                    >
                                        Resend
                                    </Button>
                                </>
                            }

                            {
                                !error && screen === 'enrollment' &&
                                <>
                                    <p style={textStyles}>
                                        <b>Step Three</b>
                                    </p>

                                    {
                                        <>
                                            <p style={textStyles}>
                                                <b>Scan the QR code below with an authenticator app or enter it manually&nbsp;
                                                    <span onClick={() => setShowSecret(true)} style={showSecret ? secretCodeCss : viewSecretCodeCss}>{showSecret ? secret?.secretKey : 'VIEW CODE'}</span>
                                                </b>
                                            </p>
                                            {qrCodeData ?
                                                <QRCode
                                                    style={{ padding: 10, background: 'white' }}
                                                    value={qrCodeData}
                                                >
                                                </QRCode> : 'Loading'
                                            }
                                        </>
                                    }

                                    <br />

                                    <Button
                                        type="primary"
                                        style={{ marginTop: 30, textAlign: 'start' }}
                                        size="large"
                                        onClick={() => setScreen('code-verification')}
                                        loading={isLoading}
                                    >
                                        Proceed
                                    </Button>
                                </>
                            }

                            {
                                !error && screen === 'code-verification' &&
                                <>
                                    <p style={textStyles}>
                                        <b>Step Four</b>
                                    </p>
                                    <p style={textStyles}>
                                        <b>Verify code</b>
                                    </p>

                                    <Form form={form} onFinish={onVerificiation}>
                                        <Form.Item name="otpCode" rules={[{ required: true, message: 'Field is empty' }]}>
                                            <Input />
                                        </Form.Item>
                                        <div style={verificationBtnsWrapper}>

                                            <Button
                                                type="primary"
                                                style={{ marginTop: 30 }}
                                                size="large"
                                                htmlType="button"
                                                onClick={() => setScreen('enrollment')}
                                                loading={isLoading}
                                            >
                                                Go Back
                                            </Button>

                                            <Button
                                                type="primary"
                                                style={{ marginTop: 30 }}
                                                size="large"
                                                htmlType="submit"
                                                loading={isLoading}
                                            >
                                                Verify
                                            </Button>
                                        </div>
                                    </Form>
                                </>
                            }

                            {
                                !error && screen === 'already-enrolled' &&
                                <>
                                    <p style={textStyles}>
                                        <b>You're already enrolled and signed.</b>
                                    </p>

                                    <Button
                                        type="primary"
                                        style={{ marginTop: 30 }}
                                        size="large"
                                        htmlType="submit"
                                        loading={isLoading}
                                        onClick={() => {
                                            go({to: search.get('goto') ? `../${search.get('goto')?.substring(6)}` : '../surveys', type: 'replace'});
                                        }}
                                    >
                                        Redirect
                                    </Button>
                                </>
                            }

                            {
                                !error && screen === 're-sign-prompt' &&
                                <>
                                    <p style={textStyles}>
                                        <b>Your 2FA session has expired. Please sign in again to view the survey resources.</b>
                                    </p>

                                    <Button
                                        type="primary"
                                        style={{ marginTop: 30 }}
                                        size="large"
                                        htmlType="submit"
                                        loading={isLoading}
                                        onClick={() => {
                                            window.location.href = `/login?goto=${search.get('goto') || 'admin/surveys'}&key=totp-auth`;
                                        }}
                                    >
                                        Logout
                                    </Button>
                                </>
                            }

                        </Card>
                    </div>
                </Col>
            </Row>
        </Layout>
    );
};
