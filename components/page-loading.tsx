type PageLoadingProps = {
  title: string;
};

export default function PageLoading({ title }: PageLoadingProps) {
  return <div aria-busy="true" aria-label="Laddar innehåll">
    <h1 className="page-title">{title}</h1>
    <div className="loading-block loading-filters" />
    <div className="grid stats" aria-hidden="true">
      <div className="loading-block loading-card" />
      <div className="loading-block loading-card" />
      <div className="loading-block loading-card" />
    </div>
  </div>;
}
