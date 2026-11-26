"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Progress, Button, message, Skeleton, List, Tag } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { authApi, appApi, type Company} from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
}

export default function OnboardingPage() {
  usePageTitle("Онбординг");
  const qc = useQueryClient();

  const { data: userResp, isLoading: userLoading } = useQuery({
    queryKey: qk.auth.me(),
    queryFn: () => authApi.me(),
  });

  const { data: vacancies, isLoading: vacLoading } = useQuery({
    queryKey: qk.vacancies.sidebar(),
    queryFn: () =>
      appApi.getVacancies({
        status: "active,paused,distribution",
        showAllVacancies: "true",
        groupMulti: "true",
        page: "1",
        pageSize: "5",
      }),
  });

  const { data: company } = useQuery({
    queryKey: qk.settings.company(),
    queryFn: () => appApi.getCompany(),
  });

  const { data: users } = useQuery({
    queryKey: qk.settings.companyUsers(),
    queryFn: () => appApi.getCompanyUsers(),
  });

  const { data: funnels } = useQuery({
    queryKey: qk.settings.funnels(),
    queryFn: () => appApi.getFunnels(),
  });

  const dismissMut = useMutation({
    mutationFn: () => appApi.updateViewSettings("onboarding", { dismissed: true }),
    onSuccess: () => {
      message.success("Онбординг скрыт");
      qc.invalidateQueries({ queryKey: qk.auth.me() });
    },
    onError: () => message.error("Не удалось скрыть"),
  });

  const isLoading = userLoading || vacLoading;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Онбординг" />
        <Skeleton active />
      </div>
    );
  }

  const hasCompany = !!(company?.name as string | undefined);  const hasVacancies = (vacancies?.items?.length ?? 0) > 0;
  const hasUsers = (users?.items?.length ?? 0) > 1;
  const hasFunnels = (funnels?.items?.length ?? 0) > 0;
  const hasProfile = !!userResp?.user?.first_name;

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Заполните профиль",
      description: "Укажите имя и должность — так кандидаты будут знать, с кем общаются",
      completed: hasProfile,
      href: "/settings/account",
    },
    {
      id: "company",
      title: "Настройте компанию",
      description: "Заполните реквизиты, регион и описание компании",
      completed: hasCompany,
      href: "/settings/company",
    },
    {
      id: "funnel",
      title: "Создайте воронку найма",
      description: "Определите этапы подбора — от отклика до оффера",
      completed: hasFunnels,
      href: "/settings/funnels",
    },
    {
      id: "vacancy",
      title: "Создайте первую вакансию",
      description: "Опубликуйте вакансию, чтобы начать получать кандидатов",
      completed: hasVacancies,
      href: "/vacancy/new",
    },
    {
      id: "team",
      title: "Пригласите коллег",
      description: "Добавьте рекрутеров и найм-менеджеров в команду",
      completed: hasUsers,
      href: "/settings/users",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div>
      <PageHeader
        title="Онбординг"
        sub="Настройте систему за несколько шагов"
        actions={
          <Button onClick={() => dismissMut.mutate()} disabled={dismissMut.isPending}>
            Скрыть онбординг
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Progress
            type="circle"
            percent={progress}
            size={64}
            strokeColor="#6B53D5"
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {completedCount} из {steps.length} шагов завершено
            </div>
            <div style={{ color: "rgba(0,0,0,.45)" }}>
              {progress === 100
                ? "Всё готово — можно начинать работу!"
                : "Продолжите настройку, чтобы начать работу"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <List
          dataSource={steps}
          renderItem={(step) => (
            <List.Item
              actions={
                step.href && !step.completed
                  ? [<Button key="go" type="link" href={step.href}>Перейти</Button>]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={
                  <Tag color={step.completed ? "green" : "default"} style={{ fontSize: 14, padding: "4px 8px" }}>
                    {step.completed ? "✓" : "○"}
                  </Tag>
                }
                title={
                  <span style={{ textDecoration: step.completed ? "line-through" : "none", color: step.completed ? "rgba(0,0,0,.45)" : "inherit" }}>
                    {step.title}
                  </span>
                }
                description={step.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
