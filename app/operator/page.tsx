export default function OperatorPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action="/api/logout" method="post">
          <button type="submit" className="rounded border px-3 py-1">
            로그아웃
          </button>
        </form>
      </div>
    </main>
  );
}
