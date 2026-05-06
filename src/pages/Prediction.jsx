import Layout from '../components/Layout.jsx';

function Prediction({ user, online, setOnline }) {
  return (
    <Layout
      user={user}
      title="AI Prediction"
      subtitle="Predictive Insights and System Forecasts"
      online={online}
      setOnline={setOnline}
    >
    </Layout>
  );
}

export default Prediction;
