export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-2xl font-bold">운영자 로그인</h1>
      <form action="/api/login" method="post" className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          비밀번호
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="rounded border px-3 py-2"
          />
        </label>
        {error && (
          <p role="alert" className="text-red-600">
            비밀번호가 올바르지 않습니다.
          </p>
        )}
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          로그인
        </button>
      </form>
    </main>
  );
}
