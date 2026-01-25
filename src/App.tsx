import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Products from './pages/Products';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import WhatsAppButton from './components/WhatsAppButton';

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <main className="main-content">
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
      </main>
      <Footer />
      <WhatsAppButton />
    </Router>
  );
};

export default App;