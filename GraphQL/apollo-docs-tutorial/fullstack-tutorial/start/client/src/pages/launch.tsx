import React, { Fragment } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { Loading, Header, LaunchDetail } from "../components";
import { ActionButton } from "../containers";
import { RouteComponentProps } from "@reach/router";
import * as LaunchDetailsTypes from "./__generated__/LaunchDetails";

export const GET_LAUNCH_DETAILS = gql`
  query LaunchDetails($launchId: ID!) {
    launch(id: $launchId) {
      id
      isInCart @client
      site
      isBooked
      rocket {
        id
        name
        type
      }
      mission {
        name
        missionPatch
      }
    }
  }
`;

interface LaunchProps extends RouteComponentProps {
  launchId?: any;
}

const Launch: React.FC<LaunchProps> = ({ launchId }) => {
  const { data, loading, error } = useQuery<
    LaunchDetailsTypes.LaunchDetails,
    LaunchDetailsTypes.LaunchDetailsVariables
  >(GET_LAUNCH_DETAILS, { variables: { launchId } });

  if (loading) return <Loading />;
  if (error) return <p> Error: {error.message}</p>;
  if (!data) return <p>Not found</p>;

  return (
    <Header>
      <Header
        image={
          data.launch && data.launch.mission && data.launch.mission.missionPatch
        }
      >
        {data && data.launch && data.launch.mission && data.launch.mission.name}
      </Header>
      <LaunchDetail {...data.launch} />
      <ActionButton {...data.launch} />
    </Header>
  );
};

export default Launch;
