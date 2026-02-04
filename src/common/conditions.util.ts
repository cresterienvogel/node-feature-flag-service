export type Subject = {
  key: string;
  userId?: string;
  tenantId?: string;
  attributes?: Record<string, string | number | boolean>;
};

type ConditionValue = string | number | boolean | Array<string | number | boolean>;

type Conditions = {
  userId?: ConditionValue;
  tenantId?: ConditionValue;
  country?: ConditionValue;
  plan?: ConditionValue;
  attrs?: Record<string, ConditionValue>;
};

function matchValue(value: unknown, condition: ConditionValue): boolean {
  if (Array.isArray(condition)) {
    return condition.some((item) => item === value);
  }
  return condition === value;
}

export function matchesConditions(subject: Subject, conditions?: Conditions | null): boolean {
  if (!conditions) return true;

  if (conditions.userId !== undefined && !matchValue(subject.userId, conditions.userId)) {
    return false;
  }

  if (conditions.tenantId !== undefined && !matchValue(subject.tenantId, conditions.tenantId)) {
    return false;
  }

  if (
    conditions.country !== undefined &&
    !matchValue(subject.attributes?.country, conditions.country)
  ) {
    return false;
  }

  if (conditions.plan !== undefined && !matchValue(subject.attributes?.plan, conditions.plan)) {
    return false;
  }

  if (conditions.attrs) {
    for (const [key, condition] of Object.entries(conditions.attrs)) {
      const value = subject.attributes?.[key];
      if (!matchValue(value, condition)) return false;
    }
  }

  return true;
}
