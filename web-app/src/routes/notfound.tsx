import { Link } from "react-router-dom";
import { SingleLayoutPage } from "../components/common/SingleLayoutPage";
import { Button } from "../components/ui/button";
import { LazyIcon } from "../components/icons";

export function NotFoundPage() {
    return (
        <SingleLayoutPage className="space-y-8">
            <div className="space-y-4">
                <h1 className="text-2xl text-center leading-loose">404</h1>
                <p className="text-muted-foreground text-center text-lg">
                    You are some where not found
                </p>
            </div>
            <div className="flex gap-2 items-center justify-center">
                <Button variant="secondary" render={<Link to="-1" />}>
                    <LazyIcon name="ArrowLeft" />
                    Go Back
                </Button>
                <Button render={<Link to="/" />}>
                    <LazyIcon weight="fill" name="House" />
                    Go Home
                </Button>
            </div>
        </SingleLayoutPage>
    );
}
