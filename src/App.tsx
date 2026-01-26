import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import LoadingSpinner from './components/LoadingSpinner';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Products = lazy(() => import('./pages/Products'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));


const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <main className="main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/about" component={About} />
            <Route path="/services/:serviceSlug" component={ServiceDetail} />
            <Route path="/services" exact component={Services} />
            {/* <Route path="/products" component={Products} /> */}
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/blog" component={Blog} />
            <Route path="/contact" component={Contact} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </Router>
  );
};

export default App;