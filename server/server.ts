import express, { Application, Request, Response, NextFunction } from 'express';
//the extra variables available from express define express types
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import redis from 'redis';
import connectRedis from 'connect-redis';
import session from 'express-session';
//if curious see package.json, had to install types for some of these dependencies to work with TS
const db = require('./model');
import { graphqlHTTP } from 'express-graphql';
import { hasUncaughtExceptionCaptureCallback, nextTick } from 'process';
import { graphql, visit, parse, BREAK } from 'graphql';
import { exists } from 'fs';
import { stringify } from 'querystring';
import { SSL_OP_CIPHER_SERVER_PREFERENCE } from 'constants';
const morgan = require('morgan');
const schema = require('./schema/schema');

dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(morgan('dev'));

const getMutationMap = (schema: any) => {
  const mutationMap: any = {};
  // get object containing all root mutations defined in the schema
  const mutationTypeFields = schema._mutationType._fields;
  // if queryTypeFields is a function, invoke it to get object with queries
  const mutationsObj =
    typeof mutationTypeFields === 'function'
      ? mutationTypeFields()
      : mutationTypeFields;

  for (const mutation in mutationsObj) {
    // get name of GraphQL type returned by query
    // if ofType --> this is collection, else not collection
    let returnedType;
    if (mutationsObj[mutation].type.ofType) {
      returnedType = [];
      returnedType.push(mutationsObj[mutation].type.ofType.name);
    }
    if (mutationsObj[mutation].type.name) {
      returnedType = mutationsObj[mutation].type.name;
    }
    mutationMap[mutation] = returnedType;
  }
  return mutationMap;
<<<<<<< HEAD
}
console.log('erikmut map', getMutationMap(schema))
=======
};
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7

const getQueryMap = (schema: any) => {
  const queryMap: any = {};
  // get object containing all root queries defined in the schema
  const queryTypeFields = schema._queryType._fields;

  // if queryTypeFields is a function, invoke it to get object with queries
  const queriesObj =
    typeof queryTypeFields === 'function' ? queryTypeFields() : queryTypeFields;
  for (const query in queriesObj) {
    // get name of GraphQL type returned by query
    // if ofType --> this is collection, else not collection
    let returnedType;
    if (queriesObj[query].type.ofType) {
      returnedType = [];
      returnedType.push(queriesObj[query].type.ofType.name);
    }
    if (queriesObj[query].type.name) {
      returnedType = queriesObj[query].type.name;
    }
    queryMap[query] = returnedType;
  }

  return queryMap;
};

const PORT = process.env.PORT || 3000;

//we might need to configure this line somehow for users running behind a proxy
// app.set('trust proxy', 1)
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
});
const RedisStore = connectRedis(session);

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

<<<<<<< HEAD
const getQuery = (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.graphQLResponse) return next();
  // query={{companies}name}
  console.log('about to make GQL query of ', res.locals.querymade)
  graphql(schema, res.locals.querymade).then((response) => {
    // console.log('getQuery middleware responded with', response.data);
    // where we would subscribe to updates to this query
    // this key is subscribed to any mutations to companies
    // companies{name} // addCompany, updateCompany, deleteCompany
    // mutation{addCompany(name:"Easyf", company_id: 2) { user_id name company_id }}
    // req.params.query = {companies{name}}
    // let tableRoot = `${req.params.query}`;
    // tableRoot = tableRoot.slice(1, 9);
    res.locals.graphQLResponse = response.data;
    console.log("graphQL responded with", res.locals.graphQLResponse);
    const subscriptions = ['Users', 'Companies']
    // subscribe the query to mutations of type Subscription
    for (let key in subscriptions) {
      redisClient.get(`${subscriptions[key]}`, (error, values) => {
        if (error) {
          console.log('redis error', error);
          res.send(error);
        }
        // Case where this query is the first to subscribe to this type.
        if (!values){
          const subs =[res.locals.querymade]
          redisClient.set(subscriptions[key], JSON.stringify(subs))
        } else {
          // Case where other queries are also subscribed to changes of this type.
          const subs = JSON.parse(`${values}`)
          subs.push(res.locals.querymade)
          redisClient.set(subscriptions[key], JSON.stringify(subs))
        }
      })
    }
    redisClient.setex(
      res.locals.querymade,
      600,
      JSON.stringify(res.locals.graphQLResponse)
    );
=======
const makeGQLrequest = (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.graphQLResponse) return next();
  console.log('about to make GQL query of ', res.locals.querymade);
  graphql(schema, res.locals.querymade).then((response) => {
    res.locals.graphQLResponse = response.data;
    console.log('graphQL responded with', response.data);
    if (!res.locals.ismutation) {
      const subscriptions = findAllTypes(response.data);
      console.log('subscribed to ', subscriptions);
      // subscribe the query to mutations of type Subscription
      for (let key in subscriptions) {
        redisClient.get(`${subscriptions[key]}`, (error, values) => {
          if (error) {
            console.log('redis error', error);
            res.send(error);
          }
          // Case where this query is the first to subscribe to this type.
          if (!values) {
            const subs = [res.locals.querymade];
            redisClient.set(subscriptions[key], JSON.stringify(subs));
          } else {
            // Case where other queries are also subscribed to changes of this type.
            const subs = JSON.parse(`${values}`);
            subs.push(res.locals.querymade);
            redisClient.set(subscriptions[key], JSON.stringify(subs));
          }
        });
      }
      redisClient.setex(
        res.locals.querymade,
        600,
        JSON.stringify(res.locals.graphQLResponse)
      );
    } else {
      // mutation was made, need to clear all subscribers.
      updateRedisAfterMutation(res.locals.graphQLResponse);
    }
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7
    next();
  });
};

const findAllTypes = (GQLresponse: any, subs: any = []) => {
  for (let key in GQLresponse) {
    if (Array.isArray(GQLresponse[key])) GQLresponse = { ...GQLresponse };
    if (key == '__typename') {
      subs.push(GQLresponse[key]);
    }
    const type = '__typename';
    if (Array.isArray(GQLresponse[key])) {
      GQLresponse = { ...GQLresponse[key][0] };

      if (GQLresponse.hasOwnProperty(type)) subs.push(GQLresponse[type]);
      subs.concat(findAllTypes(GQLresponse, subs));
    }
  }
  subs = [...new Set(subs)];
  return subs;
};

const updateRedisAfterMutation = (graphQLResponse: Object) => {
  // get the type of mutation from the first key in GQLresponse
  const mutation = Object.keys(graphQLResponse)[0];
  // get subscribed tables to the mutation from the mutation map
  const subscribedTable = getMutationMap(schema);
  // mutationquery = addUser
  const keyToClear = subscribedTable[mutation];
  // query redis for key to clear
  redisClient.get(`${keyToClear}`, (error, values) => {
    if (error) {
      console.log('redis error', error);
    }
    const queriesToClear = JSON.parse(`${values}`);
    if (queriesToClear) {
      // if queries to clear exists, iterate over queries and delete them from redis.
      for (let i = 0; i < queriesToClear.length; i++) {
        redisClient.del(queriesToClear[i], (err, res) => {
          // delete these later
          if (res === 1) {
            console.log('Deleted successfully');
          } else {
            console.log('Item to be cleared was not found in redis');
          }
        });
      }
    }
    // After array is cleared, delete the subscribed key.
    redisClient.del(`${keyToClear}`, (err, res) => {
      if (res === 1) {
        console.log('Deleted the Subscriber Key successfully');
      } else {
        console.log('Failed to delete the Subscriber Key');
      }
    });
  });
};

//quellCode for parseAst
let isQuellable: boolean;
const parseAST = (AST: any) => {
  // initialize prototype as empty object
  const proto = {};
  //let isQuellable = true;

  let operationType: string;

  // initialiaze arguments as null
  let protoArgs: any = null; //{ country: { id: '2' } }

  // initialize stack to keep track of depth first parsing
  const stack: any[] = [];

  /**
   * visit is a utility provided in the graphql-JS library. It performs a
   * depth-first traversal of the abstract syntax tree, invoking a callback
   * when each SelectionSet node is entered. That function builds the prototype.
   * Invokes a callback when entering and leaving Field node to keep track of nodes with stack
   *
   * Find documentation at:
   * https://graphql.org/graphql-js/language/#visit
   */
  visit(AST, {
    enter(node: any) {
      if (node.directives as any) {
        if (node.directives.length > 0) {
          isQuellable = false;
          return BREAK;
        }
      }
    },
    OperationDefinition(node) {
      operationType = node.operation;
      if (node.operation === 'subscription') {
        operationType = 'unQuellable';
        return BREAK;
      }
    },
    Field: {
      enter(node: any) {
        if (node.alias) {
          operationType = 'unQuellable';
          return BREAK;
        }
        if (node.arguments && node.arguments.length > 0) {
          protoArgs = protoArgs || {};
          protoArgs[node.name.value] = {};

          // collect arguments if arguments contain id, otherwise make query unquellable
          // hint: can check for graphQl type ID instead of string 'id'
          for (let i = 0; i < node.arguments.length; i++) {
            const key: any = node.arguments[i].name.value;
            const value: any = node.arguments[i].value.value;

            // for queries cache can handle only id as argument
            if (operationType === 'query') {
              if (!key.includes('id')) {
                operationType = 'unQuellable';
                return BREAK;
              }
            }
            protoArgs[node.name.value][key] = value;
          }
        }
        // add value to stack
        stack.push(node.name.value);
      },
      leave(node) {
        // remove value from stack
        stack.pop();
      },
    },
    SelectionSet(node: any, key, parent: any, path, ancestors) {
      /* Exclude SelectionSet nodes whose parents' are not of the kind
       * 'Field' to exclude nodes that do not contain information about
       *  queried fields.
       */
      if (parent.kind === 'Field') {
        // console.log(parent, "Parent Field")
        // loop through selections to collect fields
        const tempObject: any = {};
        for (let field of node.selections) {
          tempObject[field.name.value] = true;
        }

        // loop through stack to get correct path in proto for temp object;
        // mutates original prototype object;
        const protoObj = stack.reduce((prev, curr, index) => {
          return index + 1 === stack.length // if last item in path
            ? (prev[curr] = tempObject) // set value
            : (prev[curr] = prev[curr]); // otherwise, if index exists, keep value
        }, proto);
<<<<<<< HEAD
        protoObj["__typename"] = true;
        // console.log("ProtoObj,,,,,," ,protoObj);


      }
    },
  });
  
  return { proto, protoArgs, operationType };

}

=======
        protoObj['__typename'] = true;
        // console.log("ProtoObj,,,,,," ,protoObj);
      }
    },
  });
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7

  return { proto, protoArgs, operationType };
};

<<<<<<< HEAD
const ProtoQueryString = (obj:any, protoArgs:any) => {
  const argsToQuery = (protoArgs:any) => {
    let string = '';
    // fuck typescript  
    for (let key in protoArgs) {
      for (let innerKey in protoArgs[key]) {
=======
// parse's the proto to a gql query string
const ProtoQueryString = (obj: any, protoArgs: any) => {
  const argsToQuery = (protoArgs: any) => {
    let string = '';
    for (let key in protoArgs) {
      for (let innerKey in protoArgs[key]) {
        // accounts for edge case where an Int is passed in as an arguement.
        if (!isNaN(protoArgs[key][innerKey])) {
          string += innerKey + ': ' + protoArgs[key][innerKey] + ' ';
          break;
        }
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7
        string += innerKey + ': ' + '"' + protoArgs[key][innerKey] + '"' + ' ';
      }
    }
    return '(' + string + ')';
  };
<<<<<<< HEAD

  let mainString = '';
  for (let key in obj) {
    if (typeof obj[key] !== 'object') {
      mainString += ' ' + key + ' ';
    } else {
      mainString += ' ' + key + ' ';
      if (typeof protoArgs[key] == 'object') {
        const inner = argsToQuery(protoArgs);
        mainString += inner;
      }
      mainString += ProtoQueryString(obj[key], {});
    }
  }
  return '{' + mainString + '}';
};
=======
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7

  let mainString = '';
  for (let key in obj) {
    if (typeof obj[key] !== 'object') {
      mainString += ' ' + key + ' ';
    } else {
      mainString += ' ' + key + ' ';
      if (protoArgs) {
        if (typeof protoArgs[key] == 'object') {
          const inner = argsToQuery(protoArgs);
          mainString += inner;
        }
      }
      mainString += ProtoQueryString(obj[key], {});
    }
  }
  return '{' + mainString + '}';
};

// if query, checks redis for the query.
const checkRedis = (req: Request, res: Response, next: NextFunction) => {
<<<<<<< HEAD


  // console.log('req.params.query is ', req.params.query);
  console.log('query string',req.params.query)
  const AST: any = parse(req.params.query);
  console.log('made it out of parse')
  const { proto, protoArgs, operationType }: any = parseAST(AST);
  console.log('made it out of parseAST')
  console.log('erik Proto', proto)
  console.log('erik ProtoArgs', protoArgs)

  
  // result is proto
  // console.log("AST", AST.definitions[0].selectionSet.selections[0].selectionSet)
    // console.log("AST", AST.definitions[0].selectionSet)
  // console.log("Name type!!!!!!!!!!!!!",result.proto);
  

  // create query string
  let querymade = ProtoQueryString(proto, protoArgs);
  console.log("proto to query" ,querymade);
  if (operationType == 'mutation') {
    querymade = 'mutation' + querymade
    console.log('querymade is', querymade)
  }


  
  redisClient.get(querymade, (error, values) => {
=======
  if (res.locals.ismutation) return next();
  redisClient.get(res.locals.querymade, (error, values) => {
>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7
    if (error) {
      console.log('redis error', error);
      res.send(error);
    }
    if (!values) {
      console.log('query was not a key in redis session');
<<<<<<< HEAD
      res.locals.querymade = querymade;
=======

>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7
      return next();
    } else {
      console.log('query was found in cache');
      const redisValues = JSON.parse(`${values}`);
      // console.log('redis Values are', redisValues);
      res.locals.graphQLResponse = redisValues;
      return next();
    }
  });
};

<<<<<<< HEAD

const checkMutation = (req: Request, res: Response, next: NextFunction) => { 



}






// cachetest?{users{name}}
=======
const parsingAlgo = (req: Request, res: Response, next: NextFunction) => {
  const AST: any = parse(req.params.query);
  const { proto, protoArgs, operationType }: any = parseAST(AST);
  console.log(proto);
  console.log(protoArgs, 'protoargs is');

  let querymade = ProtoQueryString(proto, protoArgs);
  console.log('after PQS');
  if (operationType == 'mutation') {
    querymade = 'mutation' + querymade;
    res.locals.ismutation = true;
  }
  console.log('proto to query', querymade);
  res.locals.querymade = querymade;
  next();
};

>>>>>>> 0a38c5706b43fc1a657dd9c3a774485a0d9e7db7
app.get(
  '/cachetest/:query',
  parsingAlgo,
  checkRedis,
  makeGQLrequest,
  (req, res, next) => {
    res.send(res.locals.graphQLResponse);
  }
);

app.get('/', (req: Request, res: Response) => {
  return res.status(200).sendFile(path.join(__dirname, './views/index.html'));
});

app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
