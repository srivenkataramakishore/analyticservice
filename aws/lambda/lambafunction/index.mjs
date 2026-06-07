export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const body = typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event;

    console.log('value1 =', body.key1);
    console.log('value2 =', body.key2);
    console.log('value3 =', body.key3);

    // Simulate an application bug
    const order = null;
    console.log('Processing latest order');

    // This will crash — order is null, accessing .id throws TypeError
    console.log(`Order ID: ${order.id}`);

    return {
        statusCode: 200,
        body: JSON.stringify({
            result: "Event processed"
        })
    };
};
