import dotenv from "dotenv"
dotenv.config()
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { pipeline } from "@huggingface/transformers";
import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto"

const qdrant = new QdrantClient({
url:process.env.QDRANT_URL,
    apiKey:process.env.QDRANT_API_KEY
})

await qdrant.createPayloadIndex("kirana-data", {
    field_name: "sessionid",
    field_schema: "keyword"
});

await qdrant.createPayloadIndex("kirana-data", {
    field_name: "documentId",
    field_schema: "keyword"
});


await qdrant.createPayloadIndex("kirana-data", {
    field_name: "fileHash",
    field_schema: "keyword"
});

//    let extracter;

// async function getExtracter() {
//   if (!extracter) {
//     extracter = await pipeline(
//       "feature-extraction",
//       "nomic-ai/nomic-embed-text-v1.5",
//    {
//     device: "cpu",
//   }
//     );
//   }

//   return extracter;
// }


async function getNomicEmbeddings(texts, taskType) {
  const response = await fetch(
    "https://api-atlas.nomic.ai/v1/embedding/text",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOMIC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5",
        texts,
        task_type: taskType,
        dimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Nomic API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  return data.embeddings;
}

    export async function isDuplicate(sessionid, fileHash) {
    const result = await qdrant.count("kirana-data", {
        filter: {
            must: [
                {
                    key: "sessionid",
                    match: {
                        value: sessionid
                    }
                },
                {
                    key: "fileHash",
                    match: {
                        value: fileHash
                    }
                }
            ]
        },
        exact: true
    });

    return result.count > 0;
}

export async function storedocument(filepath, sessionid, fileHash, documentId) {
    // const extracter = await getExtracter();
    //   const documentId = crypto.randomUUID();

    const loder = await new PDFLoader(filepath, {splitPages:false})
    const doc = await loder.load()
    console.log("DOCS LENGTH:", doc.length);
console.log("DOCS:", doc);
    const spliter = await new RecursiveCharacterTextSplitter({
        chunkSize:500,
        chunkOverlap:100
    })
    const chunks = await spliter.splitDocuments(doc)
console.log(chunks.length);


    let vectors = []

//     for (let i = 0; i < chunks.length; i++) {
//       const embedding = await extracter(
//         "search_document: " + chunks[i].pageContent,
//         {
//             pooling:"mean",
//             normalize:true
//         }
//       )

//       const vector = embedding.tolist()[0]
//  vectors.push({
//   id: crypto.randomUUID(),
//   vector:vector,
//   payload:{
//    text:chunks[i].pageContent,
//       sessionid: sessionid,
//     documentId: documentId,
//     fileHash:fileHash
//   }
// })
        
//     }

const batchSize = 20;

for (let i = 0; i < chunks.length; i += batchSize) {
  const batch = chunks.slice(i, i + batchSize);

  const texts = batch.map(
    (chunk) => chunk.pageContent
  );

  const embeddings = await getNomicEmbeddings(
    texts,
    "search_document"
  );

  for (let j = 0; j < batch.length; j++) {
    vectors.push({
      id: crypto.randomUUID(),

      vector: embeddings[j],

      payload: {
        text: batch[j].pageContent,
        sessionid: sessionid,
        documentId: documentId,
        fileHash: fileHash,
      },
    });
  }

  console.log(
    `Embedded ${Math.min(
      i + batch.length,
      chunks.length
    )}/${chunks.length}`
  );
}

  
    console.log("CHUNKS:", chunks.length);
console.log("VECTORS:", vectors.length);
console.log("FIRST VECTOR:", vectors[0]);

    await qdrant.upsert("kirana-data", {
        wait:true,
        points:vectors
    })

    console.log("embeddings store in vector db");
   
    
}

export async function searchdocuments(
  query,
  sessionid,
  documentId
) {
  const embeddings = await getNomicEmbeddings(
    [query],
    "search_query"
  );

  const vector = embeddings[0];

    const result = await qdrant.query("kirana-data",{
       query:vector,
       limit:3,
       with_payload:true,
         score_threshold: 0.5,

    filter: {
        must: [
            {
                key: "sessionid",
                match: {
                    value: sessionid
                }
            },
              {
                key: "documentId",
                match: {
                    any: documentId
                }
            }
        ]
    }
    })

   return result.points
    
}

 async function getDocumentChunks(
  sessionid,
  documentId
) {
  const results = await qdrant.scroll("kirana-data", {
    filter: {
      must: [
        {
          key: "sessionid",
          match: {
            value: sessionid
          }
        },
        {
          key: "documentId",
          match: {
            value: documentId
          }
        }
      ]
    },

    limit: 1000,
    with_payload: true,
    with_vector: false
  });

  return results.points;
}

export async function getSummaryChunks(
  sessionid,
  documentId,
  offset = 0
) {
  const results = await getDocumentChunks(
    sessionid,
    documentId
  );
console.log(results);
const totalChunks = results.length;
  const chunks = results.slice(
    offset,
    offset + 2
  );

    return {
    chunks,
    totalChunks
  };
}

export async function deleteDocumentVectors(documentId) {
  await qdrant.delete("kirana-data", {
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: documentId,
          },
        },
      ],
    },
  });

  console.log("Document vectors deleted:", documentId);
}

export async function getquizs(sessionid, documentId) {

    const result = await qdrant.scroll("kirana-data", {
        limit: 100,
        with_payload: true,

        filter: {
            must: [
                {
                    key: "sessionid",
                    match: {
                        value: sessionid
                    }
                },
                {
                    key: "documentId",
                    match: {
                        any: documentId
                    }
                }
            ]
        }
    });

    const points = result.points || [];

    // Har PDF ke chunks alag karo
    const chunksByPdf = {};

    for (const point of points) {
        const pdfId = point.payload.documentId;

        if (!chunksByPdf[pdfId]) {
            chunksByPdf[pdfId] = [];
        }

        chunksByPdf[pdfId].push(point);
    }

    // PDFs ko random order me karo
    const pdfIds = Object.keys(chunksByPdf)
        .sort(() => Math.random() - 0.5);

    const randomChunks = [];

    // Randomly selected PDFs se chunks lo
    while (
        randomChunks.length < 3 &&
        pdfIds.length > 0
    ) {
        const pdfIndex = Math.floor(
            Math.random() * pdfIds.length
        );

        const pdfId = pdfIds[pdfIndex];

        const chunks = chunksByPdf[pdfId];

        if (chunks.length > 0) {

            const randomIndex = Math.floor(
                Math.random() * chunks.length
            );

            randomChunks.push(
                chunks[randomIndex]
            );

            // Same chunk dobara nahi
            chunks.splice(randomIndex, 1);
        }

        // Is PDF ke chunks khatam ho gaye
        if (chunks.length === 0) {
            pdfIds.splice(pdfIndex, 1);
        }
    }


    return randomChunks;
}