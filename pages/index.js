import Head from 'next/head';
import Layout from '../layouts/main';
import styled from 'styled-components';
import Link from 'next/link'
import Measure from 'react-measure'
import {Game} from '../components/game';

const AsideStart = styled.aside`
  background: red;
`;

const AsideEnd = styled.aside`
  background: orange;
`;

const Main = styled.main`
  width: 100%;
  display: flex;
  justify-content: center;
`;

function App({query}) {
  return (
    <Layout>
      <Main>
        <AsideStart>
        </AsideStart>
        <Game height={800} style={{border: '1px solid black'}} />
        <AsideEnd>
        </AsideEnd>
      </Main>
    </Layout>
  )
}

App.getInitialProps = ({res, query}) => {
  return {query}
}

export default App;
