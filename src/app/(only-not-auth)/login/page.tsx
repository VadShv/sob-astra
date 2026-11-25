"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Form,
  Input,
  type InputRef,
} from "antd";
import ruRU from "antd/locale/ru_RU";
import { HhIcon } from "@/components/HhIcon";
import { loginTheme } from "@/lib/theme";
import { authApi, type ApiError, type Challenge } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./login.module.css";

const ERROR_MESSAGES: Record<string, string> = {
  hhNotManager:
    "Войти через hh.ru может только менеджер работодателя. Войдите аккаунтом работодателя или по почте.",
  hhEmployerMismatch:
    "Вход через hh.ru для вашей компании в Собесо не подключён — войдите по почте.",
  hhDeactivated:
    "Доступ к Собесо закрыт администратором компании — обратитесь к нему.",
  hhNotInvited:
    "Вас ещё не пригласили в Собесо — попросите администратора компании отправить приглашение.",
  hhNoEmail:
    "hh.ru не передал почту аккаунта — войдите в Собесо по почте.",
  hhLinkedElsewhere:
    "Этот аккаунт hh.ru подключён к аккаунту Собесо с другой почтой — войдите в Собесо по почте или паролю.",
  magicLinkInvalid:
    "Ссылка для входа устарела или уже использована — запросите новую или войдите по паролю.",
  verifyLinkInvalid:
    "Ссылка подтверждения почты устарела или уже использована. Если почта ещё не подтверждена — войдите паролем, и мы пришлём новую ссылку.",
};

const CODE_LENGTH = 6;
const RESEND_DEFAULT = 60;
const CODE_EXPIRED = "Код больше не действует. Войдите заново — пришлём новый код.";

type Mode = "password" | "link";
type ResendResult = { type: "success" | "warning"; text: string } | null;

function pluralize(n: number, forms: [string, string, string]): string {
  return forms[n % 100 > 4 && n % 100 < 20 ? 2 : [2, 0, 1, 1, 1, 2][Math.min(n % 10, 5)]] || forms[1];
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isCodeValid(value: string | null | undefined): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(value ?? "");
}

function parseApiError(e: unknown) {
  const a = (e ?? {}) as ApiError;
  const n = a.response?.status;
  return {
    status: typeof n === "number" ? n : undefined,
    text: typeof a.message === "string" && a.message ? a.message : "Что-то пошло не так — попробуйте ещё раз",
    attemptsLeft: typeof a.attemptsLeft === "number" ? a.attemptsLeft : undefined,
    retryAfterSeconds: typeof a.retryAfterSeconds === "number" ? a.retryAfterSeconds : undefined,
  };
}

function codeAttemptsError(n: number): string {
  return `Неверный код. ${pluralize(n, ["Осталась", "Осталось", "Осталось"])} ${n} ${pluralize(n, ["попытка", "попытки", "попыток"])}`;
}

function resendDelay(e: { retryAfterSeconds?: number }): number {
  return e.retryAfterSeconds && e.retryAfterSeconds > 0 ? Math.ceil(e.retryAfterSeconds) : RESEND_DEFAULT;
}

function resendButtonText(n: number): string {
  return n > 0 ? `Прислать код ещё раз через ${n} с` : "Прислать код ещё раз";
}

function useCountdown(): [number, (n: number) => void] {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count <= 0) return;
    const timer = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [count]);
  return [count, setCount];
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  usePageTitle("Вход");

  const { data: user } = useQuery({
    queryKey: qk.auth.user(),
    queryFn: () => authApi.me(),
    retry: 2,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("password");
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [linkCountdown, setLinkCountdown] = useCountdown();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<ResendResult>(null);
  const [otpKey, setOtpKey] = useState(0);
  const otpRef = useRef<InputRef>(null);
  const [resendCountdown, setResendCountdown] = useCountdown();
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    setError(errParam && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, errParam) ? ERROR_MESSAGES[errParam] : null);
    if (errParam === "magicLinkInvalid") setMode("link");
  }, []);

  const handleLoginSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: qk.auth.user() });
    router.replace("/");
  };

  const resetCodeState = () => {
    setCodeValue("");
    setOtpKey((k) => k + 1);
  };

  useEffect(() => {
    if (challenge) otpRef.current?.focus();
  }, [challenge, otpKey]);

  const restartFlow = (msg: string | null) => {
    setChallenge(null);
    setCodeError(null);
    setResendResult(null);
    resetCodeState();
    setWarning(msg);
    form.setFieldValue("password", "");
  };

  const showError = (e: unknown) => {
    const err = e as { message?: string };
    const text = err && "message" in err && err.message ? err.message : "Что то пошло не так";
    message.error({ content: text, key: `error:${text}` });
  };

  const loginMutation = useMutation({
    mutationFn: (e: { email: string; password: string }) => authApi.loginWithPassword(e),
    onSuccess: async (e) => {
      if ("twoFactorRequired" in e && e.twoFactorRequired) {
        setChallenge({ challengeId: e.challengeId!, email: e.email! });
        setCodeError(null);
        setResendResult(null);
        resetCodeState();
        setResendCountdown(RESEND_DEFAULT);
        return;
      }
      await handleLoginSuccess();
    },
    onError: showError,
  });

  const codeMutation = useMutation({
    mutationFn: (e: string) => authApi.loginWithCode({ challengeId: challenge?.challengeId ?? "", code: e }),
    onSuccess: handleLoginSuccess,
    onError: (e) => {
      const parsed = parseApiError(e);
      let result: { kind: "restart" | "retry"; text: string };
      if (parsed.status === 410) {
        result = { kind: "restart", text: CODE_EXPIRED };
      } else if (parsed.attemptsLeft !== undefined) {
        if (parsed.attemptsLeft > 0) {
          result = { kind: "retry", text: codeAttemptsError(parsed.attemptsLeft) };
        } else {
          result = { kind: "restart", text: "Попытки ввода кода закончились. Войдите заново — пришлём новый код." };
        }
      } else {
        result = { kind: "retry", text: parsed.text };
      }
      if (result.kind === "restart") {
        restartFlow(result.text);
        return;
      }
      setCodeError(result.text);
      resetCodeState();
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendLoginCode({ challengeId: challenge?.challengeId ?? "" }),
    onSuccess: (e) => {
      setResendResult(
        e.emailSent
          ? { type: "success", text: `Новый код отправлен на ${e.email}. Прежний больше не подходит.` }
          : { type: "warning", text: `Письмо на ${e.email} не ушло — попробуйте ещё раз чуть позже.` }
      );
      setCodeError(null);
      resetCodeState();
      setResendCountdown(RESEND_DEFAULT);
    },
    onError: (e) => {
      const parsed = parseApiError(e);
      if (parsed.status === 410) {
        restartFlow(CODE_EXPIRED);
        return;
      }
      if (parsed.status === 429) {
        setResendCountdown(resendDelay(parsed));
      }
      setResendResult({ type: "warning", text: parsed.text });
    },
  });

  const handleCodeSubmit = (code: string) => {
    if (isCodeValid(code) && !codeMutation.isPending) {
      setCodeError(null);
      codeMutation.mutate(code);
    }
  };

  const magicLinkMutation = useMutation({
    mutationFn: (e: string) => authApi.sendMagicLink({ email: e }),
    onSuccess: (_unused, email) => {
      setLinkSentTo(email);
      setError(null);
      setLinkCountdown(60);
    },
    onError: showError,
  });

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setLinkSentTo(null);
    setError(null);
    setWarning(null);
  };

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handlePasswordSubmit = async (values: { email: string; password: string }) => {
    setWarning(null);
    await loginMutation.mutateAsync({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  };

  return (
    <ConfigProvider theme={loginTheme} locale={ruRU}>
      <div className={s.page}>
        <div className={s.card}>
          <section className={s.formSide}>
            <img
              className={s.logo}
              src="/images/ats-brand/logo-sobesso.png"
              alt="Собесо"
              width={116}
              height={29}
            />

            {challenge ? (
              <div className={s.heading}>
                <h1 className={s.title}>Введите код из письма</h1>
                <p className={s.hint}>
                  {`Отправили код на ${challenge.email}.`} Код действует 10 минут.
                </p>
              </div>
            ) : (
              <div className={s.heading}>
                <h1 className={s.title}>Вход для работодателей</h1>
                <p className={s.hint}>
                  По почте и паролю — для тех, кто работает <b>без HeadHunter</b>
                  , например только с Авито Работой.
                </p>
              </div>
            )}

            {challenge && (
              <div className={s.codeStep}>
                <div className={s.codeField}>
                  <Input.OTP
                    key={otpKey}
                    ref={otpRef as never}
                    length={CODE_LENGTH}
                    size="large"
                    formatter={stripNonDigits}
                    status={codeError ? "error" : undefined}
                    disabled={codeMutation.isPending}
                    aria-label="Код из письма"
                    onInput={(e: string[]) => setCodeValue(e.join(""))}
                    onChange={handleCodeSubmit}
                  />
                  {codeError && (
                    <div role="alert" className={s.codeError}>
                      {codeError}
                    </div>
                  )}
                </div>
                {resendResult && (
                  <Alert type={resendResult.type} showIcon message={resendResult.text} />
                )}
                <Button
                  color="purple"
                  variant="solid"
                  block
                  size="large"
                  loading={codeMutation.isPending}
                  disabled={!isCodeValid(codeValue)}
                  onClick={() => handleCodeSubmit(codeValue)}
                >
                  Войти
                </Button>
                <div className={s.codeActions}>
                  <Button
                    type="link"
                    loading={resendMutation.isPending}
                    disabled={resendCountdown > 0}
                    onClick={() => resendMutation.mutate()}
                  >
                    {resendButtonText(resendCountdown)}
                  </Button>
                  <Button type="link" onClick={() => restartFlow(null)}>
                    Назад
                  </Button>
                </div>
              </div>
            )}

            <div hidden={!!challenge} className={s.passwordStep}>
              {error && <Alert type="error" showIcon message={error} />}
              {warning && <Alert type="warning" showIcon message={warning} />}
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={(e: { email?: string }) => {
                  if ("email" in e && linkSentTo) setLinkSentTo(null);
                }}
                onFinish={(e: { email: string; password: string }) =>
                  mode === "password"
                    ? handlePasswordSubmit(e)
                    : magicLinkMutation.mutate(e.email.trim().toLowerCase())
                }
                className={s.form}
              >
                <Form.Item
                  label="Рабочая почта"
                  name="email"
                  rules={[
                    { required: true, message: "Введите почту" },
                    { type: "email", message: "Введите корректную почту" },
                  ]}
                >
                  <Input autoComplete="email" placeholder="hr@company.ru" size="large" />
                </Form.Item>

                {mode === "password" ? (
                  <Form.Item
                    label="Пароль"
                    name="password"
                    rules={[{ required: true, message: "Введите пароль" }]}
                  >
                    <Input.Password
                      autoComplete="current-password"
                      placeholder="Введите пароль"
                      size="large"
                    />
                  </Form.Item>
                ) : linkSentTo ? (
                  <Alert
                    type="success"
                    showIcon
                    className={s.linkSent}
                    message="Проверьте почту"
                    description={`Если ${linkSentTo} есть в Собесо, на него ушла ссылка для входа. Она действует 15 минут и открывает вход один раз.`}
                  />
                ) : (
                  <p className={`${s.hint} ${s.linkHint}`}>
                    Пришлём на почту ссылку — по ней войдёте без пароля. Ссылка
                    действует 15 минут.
                  </p>
                )}

                <Form.Item className={s.submit}>
                  <Button
                    color="purple"
                    variant="solid"
                    htmlType="submit"
                    block
                    size="large"
                    loading={
                      mode === "password"
                        ? loginMutation.isPending
                        : magicLinkMutation.isPending
                    }
                    disabled={mode === "link" && linkCountdown > 0}
                  >
                    {mode === "password"
                      ? "Войти"
                      : `${linkSentTo ? "Прислать ещё раз" : "Прислать ссылку"}${linkCountdown > 0 ? ` через ${linkCountdown} с` : ""}`}
                  </Button>
                </Form.Item>

                <Button
                  type="link"
                  block
                  className={s.modeSwitch}
                  onClick={() => switchMode(mode === "password" ? "link" : "password")}
                >
                  {mode === "password" ? "Войти по ссылке из письма" : "Войти по паролю"}
                </Button>
              </Form>
            </div>
          </section>

          <section className={s.hhSide}>
            <div className={s.or}>или</div>
            <h2 className={s.hhTitle}>Вход через HeadHunter</h2>
            <p className={s.hint}>
              Для всех, у кого подключена интеграция с hh. Вакансии и отклики
              подтянутся сами.
            </p>
            <Button
              type="primary"
              size="large"
              block
              className={s.hhButton}
              aria-label="Войти через HeadHunter"
              href={authApi.hhAuthUrl()}
              icon={<HhIcon className={s.hhIcon} />}
              iconPosition="end"
            >
              Войти через
            </Button>
          </section>
        </div>
      </div>
    </ConfigProvider>
  );
}
