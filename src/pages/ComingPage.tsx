interface PageProps {
  title: string;
  description: string;
}

export default function ComingPage({ title, description }: PageProps) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{description}</p>
    </div>
  );
}
